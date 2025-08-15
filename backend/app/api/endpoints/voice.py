"""Voice transcription and AI structuring endpoints"""
import base64
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile

from app.models.voice import (
    TranscriptionResponse, StructureRequest, StructureResponse,
    StructuredItem, VoiceUpdateRequest, VoiceAddItemsRequest
)
from app.models.user import User
from app.models.outline import OutlineItem
from app.api.dependencies import get_current_user
from app.services.voice_service import VoiceService
from app.services.ai_voice_service import ai_voice_service
from app.core.config import settings

# Use mock client in test mode
if settings.TESTING:
    from app.db.mock_cosmos import mock_cosmos_client as cosmos_client
else:
    from app.db.cosmos import cosmos_client

router = APIRouter()
voice_service = VoiceService()


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Transcribe audio to text using OpenAI Whisper (or mock if not configured)"""
    # Read audio data
    audio_data = await audio.read()
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"🎤 Received audio: filename={audio.filename}, size={len(audio_data)} bytes, content_type={audio.content_type}")
    
    if not audio_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty audio file"
        )
    
    # Use AI service for transcription (falls back to mock if not configured)
    transcribed_text = await ai_voice_service.transcribe_audio(
        audio_data, 
        filename=audio.filename or "audio.webm"
    )
    
    return TranscriptionResponse(
        text=transcribed_text,
        confidence=0.95,  # Whisper doesn't provide confidence scores
        language="en",
        duration=len(audio_data) / 1000  # Rough estimate
    )


@router.post("/structure", response_model=StructureResponse)
async def structure_text(
    request: StructureRequest,
    current_user: User = Depends(get_current_user)
):
    """Structure text into hierarchical outline format using AI"""
    if not request.text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty"
        )
    
    # Use AI service for structuring (falls back to rule-based if not configured)
    structured = await ai_voice_service.structure_text(request.text)
    
    # Generate intelligent suggestions based on the content
    suggestions = []
    if len(structured) > 5:
        suggestions.append("Consider grouping related items into categories")
    if any(item.level > 2 for item in structured):
        suggestions.append("Deep nesting detected - consider flattening some levels")
    if not suggestions:
        suggestions.append("Structure looks good! You can add more detail to any item")
    
    return StructureResponse(
        original=request.text,
        structured=structured,
        suggestions=suggestions
    )


@router.put("/{outline_id}/voice")
async def update_outline_with_voice(
    outline_id: str,
    request: VoiceUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update an outline using voice command"""
    # Get outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Process voice command
    updated_outline = voice_service.process_voice_command(
        outline,
        request.command
    )
    
    # Save to database
    updated_outline["updatedAt"] = datetime.utcnow().isoformat()
    await cosmos_client.update_document(outline_id, updated_outline)
    
    return {
        "message": "Outline updated successfully",
        "command": request.command,
        "itemsModified": updated_outline.get("lastModifiedCount", 0)
    }


@router.post("/{outline_id}/voice/add-items", response_model=List[OutlineItem])
async def add_items_with_voice(
    outline_id: str,
    request: VoiceAddItemsRequest,
    current_user: User = Depends(get_current_user)
):
    """Add items to outline using voice/text input"""
    # Get outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Structure text if requested
    if request.structureFirst:
        structured = voice_service.mock_structure_text(request.text)
    else:
        # Just create a single item
        structured = [StructuredItem(content=request.text, level=0)]
    
    # Add items to outline
    items = outline.get("items", [])
    new_items = []
    
    for struct_item in structured:
        item_id = f"item_{int(datetime.utcnow().timestamp() * 1000)}"
        
        # Determine parent based on level
        parent_id = request.parentId
        if struct_item.level > 0 and new_items:
            # Find appropriate parent from previously added items
            for prev_item in reversed(new_items):
                if prev_item["level"] < struct_item.level:
                    parent_id = prev_item["id"]
                    break
        
        new_item = {
            "id": item_id,
            "content": struct_item.content,
            "parentId": parent_id,
            "outlineId": outline_id,
            "order": len([i for i in items if i.get("parentId") == parent_id]),
            "level": struct_item.level,  # Keep for reference
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        items.append(new_item)
        new_items.append(new_item)
    
    # Update outline
    outline["items"] = items
    outline["itemCount"] = len(items)
    outline["updatedAt"] = datetime.utcnow().isoformat()
    
    # Save to database
    await cosmos_client.update_document(outline_id, outline)
    
    # Return new items (without level field for response)
    return [
        OutlineItem(
            id=item["id"],
            content=item["content"],
            parentId=item["parentId"],
            outlineId=item["outlineId"],
            order=item["order"],
            createdAt=item["createdAt"],
            updatedAt=item["updatedAt"]
        )
        for item in new_items
    ]


@router.post("/improve", response_model=StructureResponse)
async def improve_outline(
    request: StructureRequest,
    current_user: User = Depends(get_current_user)
):
    """Improve and restructure existing outline text using AI"""
    if not request.text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty"
        )
    
    # Use AI service for improvement
    improved = await ai_voice_service.improve_outline(request.text)
    
    return StructureResponse(
        original=request.text,
        structured=improved,
        suggestions=[
            "Structure has been optimized",
            "Related items have been grouped",
            "Hierarchy has been clarified"
        ]
    )