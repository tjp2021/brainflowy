"""Voice and AI-related models and schemas"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class TranscriptionRequest(BaseModel):
    """Schema for voice transcription request"""
    audio: bytes  # Base64 encoded audio data


class TranscriptionResponse(BaseModel):
    """Schema for voice transcription response"""
    text: str
    confidence: float = 1.0
    language: str = "en"
    duration: float = 0.0


class StructuredItem(BaseModel):
    """Schema for a structured outline item"""
    content: str
    level: int


class StructureRequest(BaseModel):
    """Schema for text structuring request"""
    text: str
    context: Optional[str] = None


class StructureResponse(BaseModel):
    """Schema for text structuring response"""
    original: str
    structured: List[StructuredItem]
    suggestions: List[str] = []


class VoiceUpdateRequest(BaseModel):
    """Schema for voice-based outline update"""
    command: str
    outlineId: str


class VoiceAddItemsRequest(BaseModel):
    """Schema for adding items via voice"""
    text: str
    parentId: Optional[str] = None
    structureFirst: bool = True