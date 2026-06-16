"""
API Routes for Discord Automation.
Provides REST endpoints for bot management and configuration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
import json

from .database import (
    get_session, get_user, get_bot, get_user_bots, create_bot,
    update_bot, update_bot_status, get_statistics, update_statistics,
    get_logs, add_log, Bot, Statistics, Log, User
)
from .bot_manager import bot_manager

router = APIRouter(prefix="/api", tags=["api"])


# ==================== BOT MANAGEMENT ====================

@router.get("/bots", response_model=List[Dict[str, Any]])
async def list_bots(user_id: int, session: AsyncSession = Depends(get_session)):
    """List all bots for a user."""
    try:
        bots = await get_user_bots(session, user_id)
        return [
            {
                "id": bot.id,
                "name": bot.name,
                "status": bot.status,
                "uptime": bot.uptime_seconds,
                "category": bot.category,
            }
            for bot in bots
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bots", response_model=Dict[str, Any])
async def create_new_bot(
    user_id: int,
    bot_data: Dict[str, Any],
    session: AsyncSession = Depends(get_session)
):
    """Create a new bot instance."""
    try:
        # Validate required fields
        required_fields = ["name", "tokens", "main_message", "category"]
        for field in required_fields:
            if field not in bot_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field: {field}"
                )
        
        bot = await create_bot(session, user_id, bot_data)
        return {
            "id": bot.id,
            "name": bot.name,
            "status": bot.status,
            "message": "Bot created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bots/{bot_id}", response_model=Dict[str, Any])
async def get_bot_details(
    bot_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get bot details."""
    try:
        bot = await get_bot(session, bot_id)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        return {
            "id": bot.id,
            "name": bot.name,
            "status": bot.status,
            "uptime": bot.uptime_seconds,
            "tokens": bot.tokens,
            "rotation_minutes": bot.rotation_minutes,
            "delay_seconds": bot.delay_seconds,
            "main_message": bot.main_message,
            "secondary_message": bot.secondary_message,
            "category": bot.category,
            "selected_orgs": bot.selected_orgs,
            "selected_modes": bot.selected_modes,
            "created_at": bot.created_at.isoformat(),
            "updated_at": bot.updated_at.isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/bots/{bot_id}", response_model=Dict[str, Any])
async def update_bot_config(
    bot_id: int,
    bot_data: Dict[str, Any],
    session: AsyncSession = Depends(get_session)
):
    """Update bot configuration."""
    try:
        bot = await update_bot(session, bot_id, bot_data)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        return {
            "id": bot.id,
            "name": bot.name,
            "status": bot.status,
            "message": "Bot updated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bots/{bot_id}")
async def delete_bot(
    bot_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Delete a bot instance."""
    try:
        # Stop bot if running
        await bot_manager.stop_bot(session, bot_id)
        
        # Delete from database
        bot = await get_bot(session, bot_id)
        if bot:
            await session.delete(bot)
            await session.commit()
        
        return {"status": "success", "message": "Bot deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BOT CONTROL ====================

@router.post("/bots/{bot_id}/start")
async def start_bot(
    bot_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Start a bot instance."""
    try:
        bot = await get_bot(session, bot_id)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Parse tokens
        tokens = bot.tokens.strip().split('\n')[0] if bot.tokens else None
        if not tokens:
            raise HTTPException(status_code=400, detail="No token configured")
        
        # Parse settings
        settings = {
            "selectedOrgs": bot.selected_orgs or "[]",
            "selectedModes": bot.selected_modes or '["1x1", "2x2", "3x3", "4x4"]',
            "category": bot.category,
            "mainMessage": bot.main_message,
            "secondaryMessage": bot.secondary_message,
            "delaySeconds": bot.delay_seconds,
            "rotationMinutes": bot.rotation_minutes,
        }
        
        result = await bot_manager.start_bot(
            session, bot_id, bot.name, tokens, settings
        )
        
        if result["status"] == "success":
            await update_bot_status(session, bot_id, "authenticating")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bots/{bot_id}/stop")
async def stop_bot(
    bot_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Stop a bot instance."""
    try:
        result = await bot_manager.stop_bot(session, bot_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bots/{bot_id}/status")
async def get_bot_status(bot_id: int):
    """Get bot status."""
    try:
        status = bot_manager.get_bot_status(bot_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== STATISTICS ====================

@router.get("/bots/{bot_id}/statistics")
async def get_bot_statistics(
    bot_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get bot statistics."""
    try:
        stats = await get_statistics(session, bot_id)
        if not stats:
            return {
                "entries": 0,
                "queues": 0,
                "matches": 0,
                "dms": 0,
                "uptime": 0
            }
        
        return {
            "entries": stats.entries,
            "queues": stats.queues,
            "matches": stats.matches,
            "dms": stats.dms,
            "uptime": stats.uptime,
            "created_at": stats.created_at.isoformat(),
            "updated_at": stats.updated_at.isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/bots/{bot_id}/statistics")
async def update_bot_statistics(
    bot_id: int,
    stats_data: Dict[str, Any],
    session: AsyncSession = Depends(get_session)
):
    """Update bot statistics."""
    try:
        stats = await update_statistics(session, bot_id, stats_data)
        return {
            "status": "success",
            "message": "Statistics updated"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== LOGS ====================

@router.get("/bots/{bot_id}/logs")
async def get_bot_logs(
    bot_id: int,
    limit: int = 100,
    session: AsyncSession = Depends(get_session)
):
    """Get bot logs from database and memory."""
    try:
        # Get logs from memory (real-time)
        memory_logs = bot_manager.get_bot_logs(bot_id, limit)
        
        # Get logs from database (persistent)
        db_logs = await get_logs(session, bot_id, limit)
        
        return {
            "memory_logs": memory_logs,
            "database_logs": [
                {
                    "id": log.id,
                    "level": log.level,
                    "message": log.message,
                    "created_at": log.created_at.isoformat()
                }
                for log in db_logs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bots/{bot_id}/logs")
async def add_bot_log(
    bot_id: int,
    log_data: Dict[str, str],
    session: AsyncSession = Depends(get_session)
):
    """Add a log entry."""
    try:
        level = log_data.get("level", "INFO")
        message = log_data.get("message", "")
        
        log = await add_log(session, bot_id, level, message)
        
        return {
            "id": log.id,
            "status": "success",
            "message": "Log added"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== HEALTH CHECK ====================

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "Discord Automation API is running"
    }
