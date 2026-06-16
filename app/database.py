"""
Database configuration and models for Discord Automation.
Consolidates instances, instanceSettings, and related data into simplified tables.
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, create_engine, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
from sqlmodel import SQLModel, Field, Session
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./discord_automation.db")

# Convert SQLite URL to async URL if needed
if DATABASE_URL.startswith("sqlite://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite:///")
else:
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

Base = declarative_base()


# ==================== MODELS ====================

class User(SQLModel, table=True):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    open_id: str = Field(unique=True, index=True, max_length=64)
    name: Optional[str] = None
    email: Optional[str] = Field(default=None, max_length=320)
    login_method: Optional[str] = Field(default=None, max_length=64)
    role: str = Field(default="user", max_length=64)  # 'user' or 'admin'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_signed_in: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    bots: List["Bot"] = None


class Bot(SQLModel, table=True):
    """
    Consolidated Bot table combining instances and instanceSettings.
    Represents each independent bot instance with its configuration.
    """
    __tablename__ = "bots"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str = Field(max_length=255)  # "BOT 1", "BOT 2", etc.
    status: str = Field(default="offline", max_length=50)  # 'online', 'offline', 'error', 'authenticating', 'scanning'
    uptime_seconds: int = Field(default=0)  # in seconds
    
    # Configuration fields (from instanceSettings)
    tokens: str  # JSON array of tokens
    rotation_minutes: int = Field(default=60)
    delay_seconds: int = Field(default=12)
    main_message: str
    secondary_message: Optional[str] = None
    category: str = Field(max_length=50)  # Mobile, Emulador, Misto, Tático, Full soco
    selected_orgs: Optional[str] = None  # JSON string of selected organizations
    selected_modes: Optional[str] = None  # JSON string of selected modes (1x1, 2x2, 3x3, 4x4)
    
    # Metadata
    process_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    statistics: Optional["Statistics"] = None
    queue_modes: List["QueueMode"] = None


class Statistics(SQLModel, table=True):
    """Statistics tracking for each bot instance."""
    __tablename__ = "statistics"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    bot_id: int = Field(foreign_key="bots.id", index=True)
    entries: int = Field(default=0)
    queues: int = Field(default=0)
    matches: int = Field(default=0)
    dms: int = Field(default=0)
    uptime: int = Field(default=0)  # in seconds
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class QueueMode(SQLModel, table=True):
    """Queue modes supported by each bot instance."""
    __tablename__ = "queue_modes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    bot_id: int = Field(foreign_key="bots.id", index=True)
    mode: str = Field(max_length=10)  # 1x1, 2x2, 3x3, 4x4
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Organization(SQLModel, table=True):
    """Organizations/Guilds associated with bot instances."""
    __tablename__ = "organizations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    bot_id: int = Field(foreign_key="bots.id", index=True)
    name: str = Field(max_length=255)
    guild_id: str = Field(max_length=255)  # Discord Guild ID
    enabled: bool = Field(default=True)
    custom_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Log(SQLModel, table=True):
    """
    Real-time logs for each bot instance.
    Can be kept in memory or persisted to database.
    """
    __tablename__ = "logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    bot_id: int = Field(foreign_key="bots.id", index=True)
    level: str = Field(max_length=20)  # INFO, SUCCESS, WARNING, ERROR
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ==================== DATABASE INITIALIZATION ====================

async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncSession:
    """Get async database session."""
    async with AsyncSessionLocal() as session:
        yield session


async def close_db():
    """Close database connection."""
    await engine.dispose()


# ==================== DATABASE OPERATIONS ====================

async def get_user(session: AsyncSession, user_id: int) -> Optional[User]:
    """Get user by ID."""
    from sqlalchemy import select
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_bot(session: AsyncSession, bot_id: int) -> Optional[Bot]:
    """Get bot by ID."""
    from sqlalchemy import select
    result = await session.execute(select(Bot).where(Bot.id == bot_id))
    return result.scalar_one_or_none()


async def get_user_bots(session: AsyncSession, user_id: int) -> List[Bot]:
    """Get all bots for a user."""
    from sqlalchemy import select
    result = await session.execute(select(Bot).where(Bot.user_id == user_id))
    return result.scalars().all()


async def create_bot(session: AsyncSession, user_id: int, bot_data: dict) -> Bot:
    """Create a new bot instance."""
    bot = Bot(user_id=user_id, **bot_data)
    session.add(bot)
    await session.commit()
    await session.refresh(bot)
    return bot


async def update_bot(session: AsyncSession, bot_id: int, bot_data: dict) -> Optional[Bot]:
    """Update bot configuration."""
    bot = await get_bot(session, bot_id)
    if bot:
        for key, value in bot_data.items():
            setattr(bot, key, value)
        bot.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(bot)
    return bot


async def update_bot_status(session: AsyncSession, bot_id: int, status: str) -> Optional[Bot]:
    """Update bot status."""
    return await update_bot(session, bot_id, {"status": status})


async def get_statistics(session: AsyncSession, bot_id: int) -> Optional[Statistics]:
    """Get statistics for a bot."""
    from sqlalchemy import select
    result = await session.execute(select(Statistics).where(Statistics.bot_id == bot_id))
    return result.scalar_one_or_none()


async def update_statistics(session: AsyncSession, bot_id: int, stats_data: dict) -> Optional[Statistics]:
    """Update bot statistics."""
    stats = await get_statistics(session, bot_id)
    if not stats:
        stats = Statistics(bot_id=bot_id, **stats_data)
        session.add(stats)
    else:
        for key, value in stats_data.items():
            setattr(stats, key, value)
    stats.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(stats)
    return stats


async def add_log(session: AsyncSession, bot_id: int, level: str, message: str) -> Log:
    """Add a log entry."""
    log = Log(bot_id=bot_id, level=level, message=message)
    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


async def get_logs(session: AsyncSession, bot_id: int, limit: int = 100) -> List[Log]:
    """Get recent logs for a bot."""
    from sqlalchemy import select, desc
    result = await session.execute(
        select(Log)
        .where(Log.bot_id == bot_id)
        .order_by(desc(Log.created_at))
        .limit(limit)
    )
    return result.scalars().all()
