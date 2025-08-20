"""Main API router that combines all endpoint routers"""
from fastapi import APIRouter

from app.api.endpoints import auth, outlines, voice, llm_actions

api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(outlines.router, prefix="/outlines", tags=["outlines"])
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])
api_router.include_router(llm_actions.router, tags=["llm"])