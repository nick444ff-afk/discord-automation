"""
API Routes for Discord Automation.
Suporte para a nova estrutura de instâncias e ponte com o novo frontend.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
import json

from .database import (
    get_session, get_user, get_instance, get_user_instances,
    get_instance_settings, update_instance_settings,
    get_statistics, get_logs, add_log, create_instance,
    Instance, InstanceSettings, Statistics, Log, User
)
from .bot_manager import bot_manager

router = APIRouter(prefix="/api", tags=["api"])

# ==================== tRPC BRIDGE (MOCK) ====================

@router.get("/bot/status")
async def bot_status_legacy(instanceId: int, session: AsyncSession = Depends(get_session)):
    instance = await get_instance(session, instanceId)
    if not instance:
        return {"status": "offline"}
    return {"status": instance.status}

@router.get("/bot/organizations")
async def bot_orgs_legacy(instanceId: int, session: AsyncSession = Depends(get_session)):
    return []

@router.get("/bot/config")
async def bot_config_legacy(instanceId: int, session: AsyncSession = Depends(get_session)):
    settings = await get_instance_settings(session, instanceId)
    if not settings:
        return {}
    return {
        "tokens": settings.tokens,
        "tokenRotation": settings.rotationMinutes,
        "messageDelay": settings.delaySeconds,
        "mainMessage": settings.mainMessage,
        "secondaryMessage": settings.secondaryMessage,
        "categoryName": settings.category,
        "organizations": json.loads(settings.selectedOrgs or "[]")
    }

@router.post("/bot/config")
async def save_bot_config_legacy(data: Dict[str, Any], session: AsyncSession = Depends(get_session)):
    instanceId = data.get("instanceId")
    if not instanceId:
        raise HTTPException(status_code=400, detail="Missing instanceId")
    
    settings_data = {
        "tokens": data.get("tokens"),
        "rotationMinutes": data.get("tokenRotation", 60),
        "delaySeconds": data.get("messageDelay", 12),
        "mainMessage": data.get("mainMessage"),
        "secondaryMessage": data.get("secondaryMessage"),
        "category": data.get("categoryName"),
        "selectedOrgs": json.dumps(data.get("organizations", []))
    }
    await update_instance_settings(session, instanceId, settings_data)
    return {"success": True}

@router.post("/bot/start")
async def start_bot_legacy(data: Dict[str, Any], session: AsyncSession = Depends(get_session)):
    instanceId = data.get("instanceId")
    instance = await get_instance(session, instanceId)
    settings = await get_instance_settings(session, instanceId)
    
    if not instance or not settings:
        raise HTTPException(status_code=404, detail="Instance or settings not found")
    
    tokens = settings.tokens.strip().split('\n')[0]
    config = {
        "selectedOrgs": settings.selectedOrgs or "[]",
        "selectedModes": '["1x1", "2x2", "3x3", "4x4"]',
        "category": settings.category,
        "mainMessage": settings.mainMessage,
        "secondaryMessage": settings.secondaryMessage,
        "delaySeconds": settings.delaySeconds,
        "rotationMinutes": settings.rotationMinutes,
    }
    
    return await bot_manager.start_bot(session, instanceId, instance.name, tokens, config)

@router.post("/bot/stop")
async def stop_bot_legacy(data: Dict[str, Any], session: AsyncSession = Depends(get_session)):
    instanceId = data.get("instanceId")
    return await bot_manager.stop_bot(session, instanceId)

# ==================== NEW REST API ====================

@router.get("/instances")
async def list_instances(user_id: int = 1, session: AsyncSession = Depends(get_session)):
    instances = await get_user_instances(session, user_id)
    return instances

@router.post("/instances")
async def create_new_instance_api(data: Dict[str, Any], session: AsyncSession = Depends(get_session)):
    user_id = data.get("userId", 1)
    name = data.get("name", "Nova Instância")
    instance = await create_instance(session, user_id, name)
    return instance

@router.get("/instances/{instance_id}/stats")
async def get_instance_stats(instance_id: int, session: AsyncSession = Depends(get_session)):
    stats = await get_statistics(session, instance_id)
    if not stats:
        return {"entries": 0, "queues": 0, "matches": 0, "dms": 0, "uptime": 0}
    return stats

@router.get("/instances/{instance_id}/logs")
async def get_instance_logs_api(instance_id: int, limit: int = 100, session: AsyncSession = Depends(get_session)):
    logs = await get_logs(session, instance_id, limit)
    return logs

@router.get("/health")
async def health_check():
    return {"status": "healthy"}
