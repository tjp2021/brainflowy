"""
LLM Actions API endpoints for AI-assisted outline editing
"""
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
import json
from datetime import datetime
import openai
from openai import OpenAI

from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/outlines/{outline_id}/llm-action", tags=["llm"])

# Request/Response models
class LLMActionRequest(BaseModel):
    type: str  # 'create', 'edit', 'research'
    targetId: Optional[str] = None  # For edits
    parentId: Optional[str] = None  # For creates
    section: Optional[str] = None  # Context section
    userPrompt: str  # What the user asked for
    currentContent: Optional[str] = None  # Current content for edits
    # New field for context-aware processing
    outlineId: Optional[str] = None  # To fetch full outline context

class LLMItem(BaseModel):
    text: str
    children: Optional[List['LLMItem']] = []

class LLMCitation(BaseModel):
    text: str
    source: str
    url: Optional[str] = None

class LLMActionResponse(BaseModel):
    action: LLMActionRequest  # Echo back the request
    result: Dict[str, Any]  # Flexible result structure

# Update forward references
LLMItem.model_rebuild()

# Mock responses removed - using real OpenAI API only
MOCK_RESPONSES = {}

def get_mock_response(action: LLMActionRequest) -> Dict[str, Any]:
    """
    Get a mock response based on the action type and prompt content.
    In production, this would call the actual LLM API.
    """
    prompt_lower = action.userPrompt.lower()
    
    print(f"Getting mock response for: type={action.type}, prompt='{action.userPrompt[:50]}'")
    
    # Simple keyword matching for mock responses
    if action.type == "create":
        if "spov" in prompt_lower or "spiky pov" in prompt_lower or "strategic point" in prompt_lower or "retention" in prompt_lower or "churn" in prompt_lower:
            print("Returning mock SPOV response")
            return MOCK_RESPONSES["create_spov"]
        else:
            return {
                "items": [
                    {
                        "text": f"New content for: {action.userPrompt[:50]}",
                        "children": []
                    }
                ],
                "suggestions": ["Tell me more about what you need"]
            }
    
    elif action.type == "edit":
        if "purpose" in prompt_lower or "pricing" in prompt_lower:
            return MOCK_RESPONSES["edit_purpose"]
        else:
            return {
                "content": f"Edited content based on: {action.userPrompt[:50]}",
                "suggestions": ["Would you like me to add more detail?"]
            }
    
    elif action.type == "research":
        if "market" in prompt_lower or "pricing" in prompt_lower or "saas" in prompt_lower:
            return MOCK_RESPONSES["research_market"]
        else:
            return {
                "content": "Research findings:",
                "citations": [
                    {
                        "text": f"Research result for: {action.userPrompt[:50]}",
                        "source": "Example Source",
                        "url": None
                    }
                ],
                "suggestions": ["Would you like more specific information?"]
            }
    
    return {
        "content": "I'll help you with that.",
        "suggestions": ["Please provide more details"]
    }

def format_outline_for_llm(outline: Dict) -> str:
    """Format the outline structure for LLM context"""
    items = outline.get("items", [])
    if not items:
        return "The outline is currently empty."
    
    # Build a hierarchical text representation
    def format_item(item, level=0):
        indent = "  " * level
        text = f"{indent}- {item.get('content', item.get('text', 'Untitled'))}"
        return text
    
    # Group items by parentId to build hierarchy
    items_by_parent = {}
    for item in items:
        parent_id = item.get("parentId")
        if parent_id not in items_by_parent:
            items_by_parent[parent_id] = []
        items_by_parent[parent_id].append(item)
    
    # Build the text representation
    lines = []
    
    def add_items(parent_id, level=0):
        if parent_id in items_by_parent:
            # Sort by order if available
            sorted_items = sorted(items_by_parent[parent_id], key=lambda x: x.get("order", 0))
            for item in sorted_items:
                lines.append(format_item(item, level))
                # Recursively add children
                add_items(item["id"], level + 1)
    
    # Start with root items (parentId = None)
    add_items(None, 0)
    
    return "\n".join(lines) if lines else "The outline has items but no clear structure."

def detect_outline_sections(outline: Dict) -> Dict[str, bool]:
    """Detect which sections exist in the outline"""
    items = outline.get("items", [])
    sections = {
        "spov": False,
        "purpose": False,
        "owner": False,
        "out_of_scope": False,
        "initiative_overview": False,
        "expert_council": False,
        "dok3": False,
        "dok2": False,
        "dok1": False
    }
    
    for item in items:
        content = item.get("content", "").lower()
        if "spov" in content or "spiky pov" in content or "strategic point" in content:
            sections["spov"] = True
        elif "purpose" in content:
            sections["purpose"] = True
        elif "owner" in content:
            sections["owner"] = True
        elif "out of scope" in content or "scope" in content:
            sections["out_of_scope"] = True
        elif "initiative overview" in content or "overview" in content:
            sections["initiative_overview"] = True
        elif "expert" in content or "council" in content or "advisor" in content:
            sections["expert_council"] = True
        elif "dok" in content and "3" in content or "insight" in content:
            sections["dok3"] = True
        elif "dok" in content and "2" in content or "knowledge" in content:
            sections["dok2"] = True
        elif "dok" in content and "1" in content or "evidence" in content or "fact" in content or "citation" in content:
            sections["dok1"] = True
    
    return sections

async def call_llm_api(action: LLMActionRequest, outline_context: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Call the actual LLM API (OpenAI, Anthropic, etc.)
    This is where you'd integrate with real AI services.
    """
    # Check for API keys - use settings instead of os.getenv
    from app.core.config import settings
    openai_key = settings.OPENAI_API_KEY
    
    if not openai_key:
        # No API key configured, return error
        print("❌ No OpenAI API key found")
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        )
    
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_key)
        
        # Build the system prompt with outline context if available
        existing_sections = {}
        if outline_context:
            outline_structure = format_outline_for_llm(outline_context)
            existing_sections = detect_outline_sections(outline_context)
            has_content = any(existing_sections.values())
            
            if has_content:
                # Outline has Brainlift template structure
                sections_list = []
                if existing_sections["spov"]:
                    sections_list.append("SPOV (Strategic Point of View)")
                if existing_sections["purpose"]:
                    sections_list.append("Purpose")
                if existing_sections["owner"]:
                    sections_list.append("Owner")
                if existing_sections["out_of_scope"]:
                    sections_list.append("Out of Scope")
                if existing_sections["initiative_overview"]:
                    sections_list.append("Initiative Overview")
                if existing_sections["expert_council"]:
                    sections_list.append("Expert Council")
                if existing_sections["dok3"]:
                    sections_list.append("DOK Level 3 - Insights")
                if existing_sections["dok2"]:
                    sections_list.append("DOK Level 2 - Knowledge")
                if existing_sections["dok1"]:
                    sections_list.append("DOK Level 1 - Evidence/Facts")
                
                system_prompt = f"""You create business document content in JSON format. Be concise and professional.
                
                Available sections: {', '.join(sections_list)}
                
                Create structured content with main points and sub-bullets."""
            else:
                # Empty outline or no clear structure
                system_prompt = """You are an AI assistant helping users create and edit business documents called Brainlifts. 
                You must respond in valid JSON format. Be concise and professional.
                
                The outline is currently empty or has no clear structure.
                
                When creating content, suggest creating it as a top-level item unless the user specifies otherwise.
                You can suggest creating standard Brainlift sections if appropriate."""
        else:
            system_prompt = """You are an AI assistant helping users create and edit business documents called Brainlifts. 
            You must respond in valid JSON format. Be concise and professional."""
        
        if action.type == "create":
            # Determine target section from prompt or action
            prompt_lower = action.userPrompt.lower()
            
            # Simple section detection
            if "spov" in prompt_lower or "spiky pov" in prompt_lower or action.section == "spov":
                target_section = "spov"
            elif action.section:
                target_section = action.section
            else:
                target_section = "general"
            
            print(f"Creating content with target_section: {target_section}")
            
            # Universal structured content creation with specific guidance
            user_prompt = f"""Create structured business content for: {action.userPrompt}

You must create a hierarchical structure with main points and supporting sub-points. 

Return exactly this JSON format:
{{
  "items": [{{
    "text": "Main headline that summarizes the topic",
    "targetSection": "{target_section}",
    "children": [
      {{"text": "First key point", "children": [{{"text": "Supporting detail for first point"}}, {{"text": "Additional evidence for first point"}}]}},
      {{"text": "Second key point", "children": [{{"text": "Supporting detail for second point"}}, {{"text": "Additional evidence for second point"}}]}},
      {{"text": "Third key point", "children": [{{"text": "Supporting detail for third point"}}, {{"text": "Additional evidence for third point"}}]}}
    ]
  }}],
  "suggestions": ["What specific aspect would you like me to expand on?", "Would you like me to add more supporting evidence?"]
}}

Always include 3 main points with 2 sub-points each. Make content specific and actionable."""
        
        elif action.type == "edit":
            current_text = action.currentContent or "No content provided"
            user_prompt = f"""Edit this content based on the request: {action.userPrompt}
            
            Current content: "{current_text}"
            
            Respond with this JSON structure:
            {{
                "content": "[Edited version of the content based on the request]",
                "suggestions": [
                    "[Follow-up suggestion 1]",
                    "[Follow-up suggestion 2]"
                ]
            }}"""
        
        elif action.type == "research":
            user_prompt = f"""Research this topic: {action.userPrompt}
            
            Respond with this JSON structure:
            {{
                "content": "Based on research:",
                "citations": [
                    {{
                        "text": "[Key finding or statistic]",
                        "source": "[Source name]",
                        "url": "[URL if available, or null]"
                    }}
                ],
                "suggestions": ["[Follow-up question]"]
            }}"""
        
        else:
            raise HTTPException(status_code=500, detail="LLM processing failed - no mock fallback")
        
        # Call OpenAI API
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Using GPT-4o-mini - more accessible and cost-effective
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for faster, more consistent responses
                max_tokens=800,   # Limit response length for speed
                timeout=15,       # 15 second timeout
                response_format={"type": "json_object"}  # Force JSON response
            )
        except Exception as api_error:
            # If response_format causes issues, try without it
            if "response_format" in str(api_error):
                print(f"response_format not supported, retrying without it")
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt + "\nIMPORTANT: You must respond with valid JSON."},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=800,
                    timeout=15
                )
            else:
                raise api_error
        
        # Parse the response
        response_text = response.choices[0].message.content
        print(f"Raw LLM response: {response_text[:500]}...")  # Log first 500 chars
        
        try:
            result = json.loads(response_text)
            print(f"Parsed LLM result: {result}")
            
            # Ensure the result has the expected structure for create actions
            if action.type == "create" and "items" not in result:
                print(f"Warning: LLM response missing 'items' field, wrapping content")
                # Try to salvage the response
                if "content" in result:
                    result = {
                        "items": [{
                            "text": result["content"],
                            "children": []
                        }],
                        "suggestions": result.get("suggestions", [])
                    }
                else:
                    print(f"Unable to salvage response, using mock")
                    raise HTTPException(status_code=500, detail="LLM processing failed - no mock fallback")
            
            return result
        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response as JSON: {e}")
            print(f"Response was: {response_text}")
            # Fall back to mock response if parsing fails
            raise HTTPException(status_code=500, detail="LLM processing failed - no mock fallback")
            
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"❌ Error calling OpenAI API: {str(e)}")
        logger.error(f"❌ Full error details: {repr(e)}")
        print(f"Error calling OpenAI API: {str(e)}")
        # No fallback to mock - raise error
        logger.error("❌ LLM processing failed")
        raise HTTPException(status_code=500, detail=f"LLM processing failed: {str(e)}")

@router.post("", response_model=LLMActionResponse)
async def process_llm_action(
    outline_id: str,
    request: LLMActionRequest,
    current_user: User = Depends(get_current_user)
) -> LLMActionResponse:
    """
    Process an LLM action for an outline.
    
    This endpoint handles three types of actions:
    - create: Generate new content based on a prompt
    - edit: Modify existing content
    - research: Find information and citations
    """
    try:
        # Import cosmos client based on testing mode
        from app.core.config import settings
        if settings.TESTING:
            from app.db.mock_cosmos import mock_cosmos_client as cosmos_client
        else:
            from app.db.cosmos import cosmos_client
        
        # Load outline context from database
        outline_context = None
        try:
            outline = await cosmos_client.get_document(outline_id, current_user.id)
            if outline:
                outline_context = outline
                print(f"Loaded outline with {len(outline.get('items', []))} items")
        except Exception as e:
            print(f"Could not load outline context: {e}")
            # Continue without context if loading fails
        
        # Log the action for analytics/debugging
        print(f"🤖 LLM Action Request: {request.type} for outline {outline_id}")
        print(f"📝 Prompt: {request.userPrompt[:100]}...")
        
        # Call LLM API with outline context
        try:
            result = await call_llm_api(request, outline_context)
        except Exception as llm_error:
            print(f"❌ LLM API call failed: {str(llm_error)}")
            # Always return a valid response with mock data
            raise HTTPException(status_code=500, detail="LLM processing failed - no mock fallback")
        
        print(f"✅ LLM Action completed, result keys: {list(result.keys()) if isinstance(result, dict) else 'not a dict'}")
        if outline_context:
            sections = detect_outline_sections(outline_context)
            print(f"Detected sections: {[k for k, v in sections.items() if v]}")
        
        # Ensure we always return a valid response
        if not result:
            print("⚠️ Empty result, using mock response")
            raise HTTPException(status_code=500, detail="LLM processing failed - no mock fallback")
        
        return LLMActionResponse(
            action=request,
            result=result
        )
        
    except Exception as e:
        print(f"Error processing LLM action: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process LLM action: {str(e)}"
        )

@router.get("/suggestions")
async def get_suggestions(
    outline_id: str,
    section: Optional[str] = None,
    current_user: User = Depends(get_current_user)
) -> Dict[str, List[str]]:
    """
    Get contextual suggestions for a specific section of the outline.
    """
    suggestions = {
        "spov": [
            "Create an SPOV about customer retention",
            "Add evidence for market opportunity",
            "Define implementation strategy"
        ],
        "purpose": [
            "Clarify the decision to be made",
            "Add timeline and stakeholders",
            "Define success criteria"
        ],
        "general": [
            "Help me structure this better",
            "Add more detail",
            "Research best practices"
        ]
    }
    
    return {
        "suggestions": suggestions.get(section, suggestions["general"])
    }