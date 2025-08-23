"""Main FastAPI application module"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.router import api_router
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

# Log environment variables at startup
logger.info("🚀 Starting BrainFlowy API")
logger.info(f"📋 Environment variables loaded:")
logger.info(f"   - OPENAI_API_KEY: {'✅ Set' if settings.OPENAI_API_KEY else '❌ Not set'}")
logger.info(f"   - ANTHROPIC_API_KEY: {'✅ Set' if settings.ANTHROPIC_API_KEY else '❌ Not set'}")
logger.info(f"   - SECRET_KEY: {'✅ Set' if settings.SECRET_KEY != 'your-secret-key-change-in-production' else '⚠️ Using default'}")
logger.info(f"   - COSMOS_ENDPOINT: {settings.COSMOS_ENDPOINT}")
logger.info(f"   - TESTING: {settings.TESTING}")

# Use mock client in test mode
if settings.TESTING:
    from app.db.mock_cosmos import mock_cosmos_client as cosmos_client
else:
    from app.db.cosmos import cosmos_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await cosmos_client.initialize()
    yield
    # Shutdown
    await cosmos_client.close()


app = FastAPI(
    title="BrainFlowy API",
    description="Backend API for BrainFlowy - Hierarchical note-taking with voice input",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "BrainFlowy API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": await cosmos_client.health_check()
    }