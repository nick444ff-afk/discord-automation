"""
Main FastAPI application for Discord Automation.
Integrates bot management, REST API, tRPC Bridge, and serves frontend static files.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from .database import init_db, close_db
from .routes import router as api_router
from .trpc_bridge import router as trpc_router
from .websocket import router as ws_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ==================== LIFECYCLE EVENTS ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    logger.info("Starting Discord Automation API...")
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    yield
    
    logger.info("Shutting down Discord Automation API...")
    try:
        await close_db()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")


# ==================== FASTAPI APPLICATION ====================

app = FastAPI(
    title="Discord Automation API",
    description="Backend API for Discord bot automation and management",
    version="1.0.0",
    lifespan=lifespan
)


# ==================== MIDDLEWARE ====================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== ROUTES ====================

# Include API routes
app.include_router(api_router)

# Include tRPC Bridge
app.include_router(trpc_router)

# Include WebSocket routes
app.include_router(ws_router)


# ==================== FRONTEND SERVING ====================

# In Docker, the frontend build is copied to /app/static
frontend_path = "/app/static"

@app.get("/health")
async def health():
    return {"status": "healthy"}

if os.path.exists(frontend_path):
    # Serve assets directory if it exists
    assets_path = os.path.join(frontend_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # If the path looks like an API call, return 404
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        
        # Check if requested path is a file in the static directory
        file_path = os.path.join(frontend_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Serve index.html for all other paths (SPA support)
        index_file = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend index.html not found"})
else:
    @app.get("/")
    async def root():
        return {
            "message": "Discord Automation API",
            "version": "1.0.0",
            "status": "running",
            "frontend": "Static directory not found at /app/static"
        }


# ==================== STARTUP ====================

if __name__ == "__main__":
    import uvicorn
    
    host = "0.0.0.0"
    port = int(os.getenv("PORT", 8080))
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )
