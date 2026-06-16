"""
Bot Manager for Discord Automation.
Manages multiple bot instances, their lifecycle, and real-time logging.
"""

import asyncio
import json
import logging
from typing import Dict, Optional, Any, List
from datetime import datetime
from enum import Enum
import discord
from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from .database import (
    get_instance, update_bot_status, add_log, get_logs
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BotState(str, Enum):
    """Bot state enumeration."""
    OFFLINE = "offline"
    AUTHENTICATING = "authenticating"
    SCANNING = "scanning"
    RUNNING = "running"
    ERROR = "error"


class BotInstance:
    """Represents a single bot instance with its client and metadata."""
    
    def __init__(self, instance_id: int, name: str):
        self.instance_id = instance_id
        self.name = name
        self.client: Optional[discord.Client] = None
        self.state = BotState.OFFLINE
        self.uptime_seconds = 0
        self.uptime_task: Optional[asyncio.Task] = None
        self.memory_logs: List[Dict[str, Any]] = []
        self.is_running = False
        
    def add_log(self, level: str, message: str):
        """Add a log to memory."""
        log_entry = {
            "level": level,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.memory_logs.insert(0, log_entry)
        self.memory_logs = self.memory_logs[:100]
        logger.info(f"[{self.name}] {level}: {message}")
    
    async def start_uptime_tracking(self):
        """Start tracking uptime."""
        while self.is_running:
            await asyncio.sleep(5)
            self.uptime_seconds += 5
    
    async def stop(self):
        """Stop the bot instance."""
        self.is_running = False
        if self.uptime_task:
            self.uptime_task.cancel()
        if self.client:
            try:
                await self.client.close()
            except Exception as e:
                logger.error(f"Error closing client: {e}")
        self.state = BotState.OFFLINE
        self.add_log("INFO", "🛑 Bot stopped by user.")


class BotManager:
    """Manages multiple bot instances."""
    
    def __init__(self):
        self.instances: Dict[int, BotInstance] = {}
        self.processing_channels: set = set()
        
    async def start_bot(
        self,
        session: AsyncSession,
        instance_id: int,
        bot_name: str,
        token: str,
        settings: Dict[str, Any]
    ) -> Dict[str, str]:
        """Start a bot instance."""
        try:
            if instance_id in self.instances and self.instances[instance_id].is_running:
                return {"status": "error", "message": "Bot is already running."}
            
            if not token or not token.strip():
                return {"status": "error", "message": "Token not configured."}
            
            instance = BotInstance(instance_id, bot_name)
            instance.state = BotState.AUTHENTICATING
            instance.add_log("INFO", f"🚀 Starting authentication for {bot_name}...")
            
            intents = discord.Intents.default()
            intents.message_content = True
            intents.guilds = True
            intents.dm_messages = True
            
            instance.client = discord.Client(intents=intents)
            
            @instance.client.event
            async def on_ready():
                instance.add_log("SUCCESS", "🔑 Token validated successfully!")
                instance.add_log("SUCCESS", f"👤 Logged in as @{instance.client.user}")
                instance.state = BotState.RUNNING
                instance.is_running = True
                instance.uptime_task = asyncio.create_task(instance.start_uptime_tracking())
                
                # Update database (requires its own session in event loop)
                # For now we'll rely on memory state and status API
                
                asyncio.create_task(self._scan_discord_data(instance, instance_id))
                
                @instance.client.event
                async def on_message(message: discord.Message):
                    if message.author == instance.client.user:
                        return
                    await self._handle_automation(instance, message, settings, instance_id)
            
            self.instances[instance_id] = instance
            asyncio.create_task(instance.client.start(token))
            
            return {"status": "success", "message": f"Bot {bot_name} started successfully!"}
            
        except Exception as e:
            logger.error(f"Error starting bot: {e}")
            return {"status": "error", "message": str(e)}
    
    async def stop_bot(self, session: AsyncSession, instance_id: int) -> Dict[str, str]:
        """Stop a bot instance."""
        if instance_id not in self.instances:
            return {"status": "error", "message": "Bot not found."}
        
        instance = self.instances[instance_id]
        await instance.stop()
        del self.instances[instance_id]
        return {"status": "success", "message": "Bot stopped."}
    
    async def _scan_discord_data(self, instance: BotInstance, instance_id: int):
        """Scan Discord servers."""
        try:
            instance.state = BotState.SCANNING
            instance.add_log("INFO", "🔍 Starting server scan...")
            
            guilds = instance.client.guilds
            for guild in guilds:
                instance.add_log("SUCCESS", f"🏢 Organization scanned: {guild.name}")
            
            instance.add_log("INFO", f"📊 Total organizations found: {len(guilds)}")
            instance.add_log("SUCCESS", "✅ Scan completed successfully!")
            instance.state = BotState.RUNNING
        except Exception as e:
            instance.add_log("ERROR", f"❌ Error during scan: {str(e)}")
            instance.state = BotState.RUNNING
    
    async def _handle_automation(self, instance: BotInstance, message: discord.Message, settings: Dict[str, Any], instance_id: int):
        """Automation logic."""
        # Implement logic similar to before but adapted for new structure
        pass

    def get_bot_status(self, instance_id: int) -> Dict[str, Any]:
        """Get bot status."""
        if instance_id not in self.instances:
            return {"state": "offline", "is_running": False, "uptime": 0}
        
        instance = self.instances[instance_id]
        return {
            "state": instance.state,
            "is_running": instance.is_running,
            "uptime": instance.uptime_seconds
        }

    def get_bot_logs(self, instance_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        """Get logs from memory."""
        if instance_id not in self.instances:
            return []
        return self.instances[instance_id].memory_logs[:limit]

bot_manager = BotManager()
