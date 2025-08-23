"""
Public LLM endpoint that doesn't require authentication
This allows the frontend to use LLM features without login
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.api.endpoints.llm_actions import LLMActionRequest, LLMActionResponse, call_llm_api

router = APIRouter()

@router.post("/public/llm-action", response_model=LLMActionResponse)
async def public_llm_action(
    request: LLMActionRequest
) -> LLMActionResponse:
    """
    Public endpoint for LLM actions - no authentication required
    This allows demo/test usage without login
    """
    try:
        # Call the same LLM API logic but without outline context
        result = await call_llm_api(request, outline_context=None)
        
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