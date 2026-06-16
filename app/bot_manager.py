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
    get_bot, update_bot_status, update_statistics, add_log, get_logs
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
    
    def __init__(self, bot_id: int, name: str):
        self.bot_id = bot_id
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
        # Keep only last 100 logs in memory
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
        self.processing_channels: set = set()  # Prevent duplicate processing
        
    async def start_bot(
        self,
        session: AsyncSession,
        bot_id: int,
        bot_name: str,
        token: str,
        settings: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Start a bot instance.
        
        Args:
            session: Database session
            bot_id: Bot instance ID
            bot_name: Bot name
            token: Discord bot token
            settings: Bot configuration settings
            
        Returns:
            Status dictionary with success/error message
        """
        try:
            # Check if bot is already running
            if bot_id in self.instances and self.instances[bot_id].is_running:
                return {"status": "error", "message": "Bot is already running."}
            
            # Validate token
            if not token or not token.strip():
                await update_bot_status(session, bot_id, "offline")
                return {"status": "error", "message": "Token not configured."}
            
            # Create bot instance
            instance = BotInstance(bot_id, bot_name)
            instance.state = BotState.AUTHENTICATING
            instance.add_log("INFO", f"🚀 Starting authentication for {bot_name}...")
            
            # Create Discord client
            intents = discord.Intents.default()
            intents.message_content = True
            intents.guilds = True
            intents.dm_messages = True
            
            instance.client = discord.Client(intents=intents)
            
            # Setup event handlers
            @instance.client.event
            async def on_ready():
                instance.add_log("SUCCESS", "🔑 Token validated successfully!")
                instance.add_log("SUCCESS", f"👤 Logged in as @{instance.client.user}")
                instance.state = BotState.RUNNING
                instance.is_running = True
                
                # Start uptime tracking
                instance.uptime_task = asyncio.create_task(instance.start_uptime_tracking())
                
                # Update database
                await update_bot_status(session, bot_id, "online")
                
                # Start scanning Discord data
                asyncio.create_task(self._scan_discord_data(session, instance, bot_id))
                
                # Register message handler
                @instance.client.event
                async def on_message(message: discord.Message):
                    if message.author == instance.client.user:
                        return
                    await self._handle_automation(session, instance, message, settings, bot_id)
            
            @instance.client.event
            async def on_error(event, *args, **kwargs):
                instance.add_log("ERROR", f"❌ Error in {event}: {args}")
            
            # Store instance
            self.instances[bot_id] = instance
            
            # Login
            await instance.client.login(token)
            
            # Connect
            asyncio.create_task(instance.client.connect())
            
            return {"status": "success", "message": f"Bot {bot_name} started successfully!"}
            
        except Exception as e:
            logger.error(f"Error starting bot: {e}")
            await update_bot_status(session, bot_id, "error")
            return {"status": "error", "message": str(e)}
    
    async def stop_bot(self, session: AsyncSession, bot_id: int) -> Dict[str, str]:
        """Stop a bot instance."""
        if bot_id not in self.instances:
            return {"status": "error", "message": "Bot not found."}
        
        instance = self.instances[bot_id]
        await instance.stop()
        await update_bot_status(session, bot_id, "offline")
        del self.instances[bot_id]
        
        return {"status": "success", "message": "Bot stopped."}
    
    async def _scan_discord_data(self, session: AsyncSession, instance: BotInstance, bot_id: int):
        """Scan Discord servers and channels."""
        try:
            instance.state = BotState.SCANNING
            instance.add_log("INFO", "🔍 Starting server scan...")
            
            guilds = await instance.client.fetch_guilds(limit=None)
            guild_count = 0
            
            async for guild in guilds:
                try:
                    guild_data = await instance.client.fetch_guild(guild.id)
                    instance.add_log("SUCCESS", f"🏢 Organization scanned: {guild_data.name}")
                    guild_count += 1
                except Exception as e:
                    instance.add_log("ERROR", f"❌ Error scanning guild {guild.id}: {str(e)}")
            
            instance.add_log("INFO", f"📊 Total organizations found: {guild_count}")
            instance.add_log("SUCCESS", "✅ Scan completed successfully!")
            instance.state = BotState.RUNNING
            
        except Exception as e:
            instance.add_log("ERROR", f"❌ Critical error during scan: {str(e)}")
            instance.state = BotState.RUNNING
    
    async def _handle_automation(
        self,
        session: AsyncSession,
        instance: BotInstance,
        message: discord.Message,
        settings: Dict[str, Any],
        bot_id: int
    ):
        """Handle automation logic for incoming messages."""
        try:
            channel = message.channel
            
            # Prevent duplicate processing
            if channel.id in self.processing_channels:
                return
            
            # Parse settings
            selected_orgs = settings.get("selectedOrgs", [])
            if isinstance(selected_orgs, str):
                try:
                    selected_orgs = json.loads(selected_orgs)
                except:
                    selected_orgs = []
            
            selected_modes = settings.get("selectedModes", ["1x1", "2x2", "3x3", "4x4"])
            if isinstance(selected_modes, str):
                try:
                    selected_modes = json.loads(selected_modes)
                except:
                    selected_modes = ["1x1", "2x2", "3x3", "4x4"]
            
            category = settings.get("category", "Mobile").lower()
            
            # Filter by organization
            if hasattr(message, 'guild') and message.guild:
                guild_name = message.guild.name.lower()
                if not any(org.lower() in guild_name for org in selected_orgs):
                    return
            
            # Filter by category
            if hasattr(channel, 'category') and channel.category:
                channel_category = channel.category.name.lower()
                if category != "qualquer" and category not in channel_category:
                    return
            
            # Filter by queue mode
            channel_name = channel.name.lower()
            matched_mode = None
            for mode in selected_modes:
                if mode.lower() in channel_name:
                    matched_mode = mode
                    break
            
            if not matched_mode:
                return
            
            # Find message with buttons
            try:
                self.processing_channels.add(channel.id)
                
                # Fetch recent messages
                messages = await channel.history(limit=11).flatten()
                target_msg = None
                
                for msg in messages:
                    if msg.components:
                        target_msg = msg
                        break
                
                if not target_msg:
                    return
                
                # Find button to click
                button_to_click = None
                for row in target_msg.components:
                    for component in row.children:
                        if isinstance(component, discord.Button):
                            label = (component.label or "").lower()
                            
                            # Skip cancel buttons
                            if any(word in label for word in ["cancelar", "finalizar", "recusar", "fechar", "sair"]):
                                continue
                            
                            # Button selection logic
                            if category.startswith("tático"):
                                if "mobile" in label or "emulador" in label:
                                    button_to_click = component
                                    break
                            elif matched_mode == "1x1":
                                if any(word in label for word in ["normal", "infinito", "gelo"]):
                                    button_to_click = component
                                    break
                            elif category.startswith("misto"):
                                if "emu" in label or "misto" in label:
                                    button_to_click = component
                                    break
                            
                            if not button_to_click:
                                button_to_click = component
                    
                    if button_to_click:
                        break
                
                if button_to_click:
                    # Random delay to avoid detection
                    delay = 2 + (asyncio.get_event_loop().time() % 1)
                    await asyncio.sleep(delay)
                    
                    # Click button
                    await button_to_click.click()
                    
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    log_msg = f"[{timestamp}] ✅ Button '{button_to_click.label}' clicked in #{channel.name}"
                    instance.add_log("SUCCESS", log_msg)
                    await add_log(session, bot_id, "SUCCESS", log_msg)
                    
                    # Send main message after delay
                    if settings.get("mainMessage"):
                        delay_seconds = settings.get("delaySeconds", 12)
                        await asyncio.sleep(delay_seconds)
                        
                        await channel.send(settings.get("mainMessage"))
                        msg_log = f"[{timestamp}] 📩 Message sent in #{channel.name}"
                        instance.add_log("SUCCESS", msg_log)
                        await add_log(session, bot_id, "SUCCESS", msg_log)
                        
                        # Send secondary message if configured
                        if settings.get("secondaryMessage"):
                            await asyncio.sleep(1)
                            await channel.send(settings.get("secondaryMessage"))
                            msg_log2 = f"[{timestamp}] 📩 Secondary message sent in #{channel.name}"
                            instance.add_log("SUCCESS", msg_log2)
                            await add_log(session, bot_id, "SUCCESS", msg_log2)
                        
                        # Update statistics
                        await update_statistics(session, bot_id, {
                            "entries": 1,
                            "queues": 1
                        })
                
            except Exception as e:
                timestamp = datetime.now().strftime("%H:%M:%S")
                error_log = f"[{timestamp}] ❌ Error clicking button: {str(e)}"
                instance.add_log("ERROR", error_log)
                await add_log(session, bot_id, "ERROR", error_log)
            
            finally:
                # Release channel after 5 seconds
                await asyncio.sleep(5)
                self.processing_channels.discard(channel.id)
        
        except Exception as e:
            logger.error(f"Error in automation handler: {e}")
    
    def get_bot_status(self, bot_id: int) -> Dict[str, Any]:
        """Get bot status."""
        if bot_id not in self.instances:
            return {
                "state": "offline",
                "is_running": False,
                "uptime": 0
            }
        
        instance = self.instances[bot_id]
        return {
            "state": instance.state.value,
            "is_running": instance.is_running,
            "uptime": instance.uptime_seconds
        }
    
    def get_bot_logs(self, bot_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        """Get bot logs from memory."""
        if bot_id not in self.instances:
            return []
        
        instance = self.instances[bot_id]
        return instance.memory_logs[:limit]


# Global bot manager instance
bot_manager = BotManager()
