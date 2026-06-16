"""
WebSocket handlers for real-time communication.
Provides real-time log streaming and bot status updates to the frontend.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set, Dict, Any
import json
import asyncio
import logging

from .bot_manager import bot_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, bot_id: int, websocket: WebSocket):
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        if bot_id not in self.active_connections:
            self.active_connections[bot_id] = set()
        self.active_connections[bot_id].add(websocket)
        logger.info(f"Client connected to bot {bot_id}")
    
    def disconnect(self, bot_id: int, websocket: WebSocket):
        """Unregister a WebSocket connection."""
        if bot_id in self.active_connections:
            self.active_connections[bot_id].discard(websocket)
            if not self.active_connections[bot_id]:
                del self.active_connections[bot_id]
        logger.info(f"Client disconnected from bot {bot_id}")
    
    async def broadcast(self, bot_id: int, message: Dict[str, Any]):
        """Broadcast a message to all connected clients for a bot."""
        if bot_id not in self.active_connections:
            return
        
        disconnected = set()
        for connection in self.active_connections[bot_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.active_connections[bot_id].discard(connection)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws/logs/{bot_id}")
async def websocket_logs(websocket: WebSocket, bot_id: int):
    """
    WebSocket endpoint for real-time log streaming.
    Clients can connect to receive live logs for a specific bot.
    """
    await manager.connect(bot_id, websocket)
    
    try:
        while True:
            # Receive message from client (keep-alive or commands)
            data = await websocket.receive_text()
            
            # Parse incoming message
            try:
                message = json.loads(data)
                command = message.get("command")
                
                if command == "ping":
                    # Respond to ping
                    await websocket.send_json({"type": "pong"})
                
                elif command == "get_logs":
                    # Send current logs
                    logs = bot_manager.get_bot_logs(bot_id, limit=100)
                    await websocket.send_json({
                        "type": "logs",
                        "data": logs
                    })
                
                elif command == "get_status":
                    # Send current status
                    status = bot_manager.get_bot_status(bot_id)
                    await websocket.send_json({
                        "type": "status",
                        "data": status
                    })
            
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    
    except WebSocketDisconnect:
        manager.disconnect(bot_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(bot_id, websocket)


@router.websocket("/ws/status/{bot_id}")
async def websocket_status(websocket: WebSocket, bot_id: int):
    """
    WebSocket endpoint for real-time bot status updates.
    Sends periodic status updates to connected clients.
    """
    await manager.connect(bot_id, websocket)
    
    try:
        while True:
            # Send status every 5 seconds
            await asyncio.sleep(5)
            
            status = bot_manager.get_bot_status(bot_id)
            await websocket.send_json({
                "type": "status_update",
                "data": status
            })
    
    except WebSocketDisconnect:
        manager.disconnect(bot_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(bot_id, websocket)


async def send_log_update(bot_id: int, log_data: Dict[str, Any]):
    """Send log update to all connected clients."""
    message = {
        "type": "log_update",
        "data": log_data
    }
    await manager.broadcast(bot_id, message)


async def send_status_update(bot_id: int, status_data: Dict[str, Any]):
    """Send status update to all connected clients."""
    message = {
        "type": "status_update",
        "data": status_data
    }
    await manager.broadcast(bot_id, message)
