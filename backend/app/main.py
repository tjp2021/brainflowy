"""Main FastAPI application module"""
import sys
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Add startup logging
print("🚀 Starting BrainFlowy Backend...", file=sys.stderr)

try:
    from app.api.router import api_router
    from app.core.config import settings
    print("✅ Imports successful", file=sys.stderr)
except Exception as e:
    print(f"❌ Import error: {e}", file=sys.stderr)
    traceback.print_exc()
    raise

# Use mock client in test mode
if settings.TESTING:
    from app.db.mock_cosmos import mock_cosmos_client as cosmos_client
else:
    from app.db.cosmos import cosmos_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("📦 Initializing database...", file=sys.stderr)
    try:
        await cosmos_client.initialize()
        print("✅ Database initialized", file=sys.stderr)
    except Exception as e:
        print(f"⚠️ Database initialization failed (non-fatal): {e}", file=sys.stderr)
        # Don't fail startup if database isn't available
    yield
    # Shutdown
    try:
        await cosmos_client.close()
    except:
        pass


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
    try:
        db_status = await cosmos_client.health_check()
    except:
        db_status = "unavailable"
    
    return {
        "status": "healthy",
        "database": db_status,
        "testing_mode": settings.TESTING,
        "cors_origins": settings.CORS_ORIGINS,
        "api_keys": {
            "openai": bool(settings.OPENAI_API_KEY),
            "claude": bool(settings.CLAUDE_API_KEY)
        }
    }

@app.get("/ping")
async def ping():
    """Simple ping endpoint for basic connectivity test"""
    return {"status": "pong", "service": "brainflowy-backend"}