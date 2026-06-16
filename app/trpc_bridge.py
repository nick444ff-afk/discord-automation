"""
tRPC Bridge for Discord Automation.
This module provides a compatibility layer between the tRPC frontend and the Python FastAPI backend.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Optional
import json
from datetime import datetime

from .database import (
    get_session, get_user_instances, get_instance, get_instance_settings,
    update_instance_settings, get_statistics, get_logs
)

router = APIRouter(prefix="/api/trpc", tags=["trpc"])

@router.get("/{procedure}")
async def trpc_query(procedure: str, request: Request, session: AsyncSession = Depends(get_session)):
    """Handles tRPC queries from the frontend."""
    params = request.query_params
    input_json = params.get("input", "{}")
    try:
        input_data = json.loads(input_json)
    except:
        input_data = {}

    # Extract the actual procedure name (e.g., "instances.list" -> "list")
    # tRPC calls usually look like /api/trpc/instances.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D
    
    if "instances.list" in procedure:
        instances = await get_user_instances(session, 1) # Default user 1
        return {"result": {"data": {"json": [
            {
                "id": inst.id,
                "name": inst.name,
                "status": inst.status,
                "uptime": inst.uptime,
                "createdAt": inst.createdAt.isoformat() if inst.createdAt else None
            } for inst in instances
        ]}}}

    elif "settings.get" in procedure:
        instance_id = input_data.get("json", {}).get("instanceId")
        if not instance_id:
            # Handle batching or nested structure
            instance_id = input_data.get("0", {}).get("json", {}).get("instanceId")
            
        settings = await get_instance_settings(session, instance_id)
        if not settings:
            return {"result": {"data": {"json": {}}}}
        
        return {"result": {"data": {"json": {
            "tokens": settings.tokens,
            "tokenRotation": settings.rotationMinutes,
            "messageDelay": settings.delaySeconds,
            "mainMessage": settings.mainMessage,
            "secondaryMessage": settings.secondaryMessage,
            "categoryName": settings.category,
            "organizations": json.loads(settings.selectedOrgs or "[]")
        }}}}

    elif "statistics.get" in procedure:
        instance_id = input_data.get("json", {}).get("instanceId")
        stats = await get_statistics(session, instance_id)
        if not stats:
            return {"result": {"data": {"json": {"entries": 0, "queues": 0, "matches": 0, "dms": 0, "uptime": 0}}}}
        
        return {"result": {"data": {"json": {
            "entries": stats.entries,
            "queues": stats.queues,
            "matches": stats.matches,
            "dms": stats.dms,
            "uptime": stats.uptime
        }}}}

    return {"result": {"data": {"json": {}}}}

@router.post("/{procedure}")
async def trpc_mutation(procedure: str, request: Request, session: AsyncSession = Depends(get_session)):
    """Handles tRPC mutations from the frontend."""
    body = await request.json()
    input_data = body.get("json", {})
    
    if "settings.save" in procedure:
        instance_id = input_data.get("instanceId")
        settings_data = {
            "tokens": input_data.get("tokens"),
            "rotationMinutes": input_data.get("tokenRotation"),
            "delaySeconds": input_data.get("messageDelay"),
            "mainMessage": input_data.get("mainMessage"),
            "secondaryMessage": input_data.get("secondaryMessage"),
            "category": input_data.get("categoryName"),
            "selectedOrgs": json.dumps(input_data.get("organizations", []))
        }
        await update_instance_settings(session, instance_id, settings_data)
        return {"result": {"data": {"json": {"success": True}}}}

    elif "instances.updateStatus" in procedure:
        # Mock status update for now
        return {"result": {"data": {"json": {"success": True}}}}

    return {"result": {"data": {"json": {}}}}
