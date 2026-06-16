"""
Database configuration and models for Discord Automation.
Alinhado com a estrutura do novo frontend (Drizzle Schema).
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel, Field, Session, Relationship
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


# ==================== MODELS ====================

class User(SQLModel, table=True):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    openId: str = Field(unique=True, index=True, max_length=64)
    name: Optional[str] = None
    email: Optional[str] = Field(default=None, max_length=320)
    loginMethod: Optional[str] = Field(default=None, max_length=64)
    role: str = Field(default="user", max_length=64)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    lastSignedIn: datetime = Field(default_factory=datetime.utcnow)
    
    instances: List["Instance"] = Relationship(back_populates="user")


class Instance(SQLModel, table=True):
    """Bot instances table - represents each independent bot instance."""
    __tablename__ = "instances"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="users.id", index=True)
    name: str = Field(max_length=255)
    status: str = Field(default="offline", max_length=50)
    uptime: int = Field(default=0)
    processId: Optional[int] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional[User] = Relationship(back_populates="instances")
    settings: Optional["InstanceSettings"] = Relationship(back_populates="instance")
    statistics: Optional["Statistics"] = Relationship(back_populates="instance")
    queueModes: List["QueueMode"] = Relationship(back_populates="instance")


class InstanceSettings(SQLModel, table=True):
    """Instance settings table - stores configuration for each bot instance."""
    __tablename__ = "instanceSettings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    instanceId: int = Field(foreign_key="instances.id", index=True)
    tokens: str
    rotationMinutes: int = Field(default=60)
    delaySeconds: int = Field(default=12)
    mainMessage: str
    secondaryMessage: Optional[str] = None
    category: str = Field(max_length=50)
    selectedOrgs: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    instance: Optional[Instance] = Relationship(back_populates="settings")


class Statistics(SQLModel, table=True):
    """Statistics tracking for each bot instance."""
    __tablename__ = "statistics"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    instanceId: int = Field(foreign_key="instances.id", index=True)
    entries: int = Field(default=0)
    queues: int = Field(default=0)
    matches: int = Field(default=0)
    dms: int = Field(default=0)
    uptime: int = Field(default=0)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    instance: Optional[Instance] = Relationship(back_populates="statistics")


class QueueMode(SQLModel, table=True):
    """Queue modes supported by each bot instance."""
    __tablename__ = "queueModes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    instanceId: int = Field(foreign_key="instances.id", index=True)
    mode: str = Field(max_length=10)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    instance: Optional[Instance] = Relationship(back_populates="queueModes")


class Organization(SQLModel, table=True):
    """Organizations/Guilds associated with bot instances."""
    __tablename__ = "organizations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    instanceId: int = Field(foreign_key="instances.id", index=True)
    name: str = Field(max_length=255)
    enabled: int = Field(default=1)
    customMessage: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class Log(SQLModel, table=True):
    """Real-time logs for each bot instance."""
    __tablename__ = "logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    instanceId: int = Field(foreign_key="instances.id", index=True)
    level: str = Field(max_length=20)
    message: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


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


async def get_instance(session: AsyncSession, instance_id: int) -> Optional[Instance]:
    """Get instance by ID."""
    from sqlalchemy import select
    result = await session.execute(select(Instance).where(Instance.id == instance_id))
    return result.scalar_one_or_none()


async def update_bot_status(session: AsyncSession, instance_id: int, status: str) -> Optional[Instance]:
    """Update bot instance status."""
    instance = await get_instance(session, instance_id)
    if instance:
        instance.status = status
        instance.updatedAt = datetime.utcnow()
        await session.commit()
        await session.refresh(instance)
    return instance


async def get_user_instances(session: AsyncSession, user_id: int) -> List[Instance]:
    """Get all instances for a user."""
    from sqlalchemy import select
    result = await session.execute(select(Instance).where(Instance.userId == user_id))
    return result.scalars().all()


async def create_instance(session: AsyncSession, user_id: int, name: str) -> Instance:
    """Create a new bot instance."""
    instance = Instance(userId=user_id, name=name)
    session.add(instance)
    await session.commit()
    await session.refresh(instance)
    return instance


async def get_instance_settings(session: AsyncSession, instance_id: int) -> Optional[InstanceSettings]:
    """Get settings for an instance."""
    from sqlalchemy import select
    result = await session.execute(select(InstanceSettings).where(InstanceSettings.instanceId == instance_id))
    return result.scalar_one_or_none()


async def update_instance_settings(session: AsyncSession, instance_id: int, settings_data: dict) -> InstanceSettings:
    """Update or create instance settings."""
    settings = await get_instance_settings(session, instance_id)
    if not settings:
        settings = InstanceSettings(instanceId=instance_id, **settings_data)
        session.add(settings)
    else:
        for key, value in settings_data.items():
            setattr(settings, key, value)
        settings.updatedAt = datetime.utcnow()
    await session.commit()
    await session.refresh(settings)
    return settings


async def get_statistics(session: AsyncSession, instance_id: int) -> Optional[Statistics]:
    """Get statistics for an instance."""
    from sqlalchemy import select
    result = await session.execute(select(Statistics).where(Statistics.instanceId == instance_id))
    return result.scalar_one_or_none()


async def add_log(session: AsyncSession, instance_id: int, level: str, message: str) -> Log:
    """Add a log entry."""
    log = Log(instanceId=instance_id, level=level, message=message)
    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


async def get_logs(session: AsyncSession, instance_id: int, limit: int = 100) -> List[Log]:
    """Get recent logs for an instance."""
    from sqlalchemy import select, desc
    result = await session.execute(
        select(Log)
        .where(Log.instanceId == instance_id)
        .order_by(desc(Log.createdAt))
        .limit(limit)
    )
    return result.scalars().all()
