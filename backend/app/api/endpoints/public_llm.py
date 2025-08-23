"""
Public LLM endpoint that doesn't require authentication
This allows the frontend to use LLM features without login
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.api.endpoints.llm_actions import LLMActionRequest, LLMActionResponse, call_llm_api

router = APIRouter()

# Default Brainlift template structure for context - matches the actual template
DEFAULT_OUTLINE_CONTEXT = {
    "items": [
        {"id": "1", "content": "[Title]: [Subtitle]", "parentId": None, "order": 0},
        {"id": "2", "content": "Owner", "parentId": None, "order": 1},
        {"id": "3", "content": "Purpose", "parentId": None, "order": 2},
        {"id": "4", "content": "Out of scope:", "parentId": "3", "order": 0},
        {"id": "5", "content": "Initiative Overview:", "parentId": "3", "order": 1},
        {"id": "6", "content": "SPOV DOK 4", "parentId": None, "order": 3},
        {"id": "7", "content": "DOK3 - Insights", "parentId": None, "order": 4},
        {"id": "8", "content": "DOK2 - Knowledge Tree", "parentId": None, "order": 5},
        {"id": "9", "content": "DOK1 - Evidence & Facts", "parentId": None, "order": 6},
        {"id": "10", "content": "Expert Advisory Council", "parentId": None, "order": 7}
    ]
}

@router.post("/public/llm-action", response_model=LLMActionResponse)
async def public_llm_action(
    request: LLMActionRequest
) -> LLMActionResponse:
    """
    Public endpoint for LLM actions - no authentication required
    This allows demo/test usage without login
    """
    try:
        # Use default Brainlift template context for proper section detection
        result = await call_llm_api(request, outline_context=DEFAULT_OUTLINE_CONTEXT)
        
        if not result:
            raise HTTPException(status_code=500, detail="Empty response from LLM")
        
        return LLMActionResponse(
            action=request,
            result=result
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in public LLM action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))