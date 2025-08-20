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

router = APIRouter(prefix="/outlines/{outline_id}/llm-action", tags=["llm"])

# Request/Response models
class LLMActionRequest(BaseModel):
    type: str  # 'create', 'edit', 'research'
    targetId: Optional[str] = None  # For edits
    parentId: Optional[str] = None  # For creates
    section: Optional[str] = None  # Context section
    userPrompt: str  # What the user asked for
    currentContent: Optional[str] = None  # Current content for edits

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

# Mock responses for development
# In production, these would be replaced with actual LLM API calls
MOCK_RESPONSES = {
    "create_spov": {
        "items": [
            {
                "text": "AI-Driven Customer Retention Strategy",
                "children": [
                    {
                        "text": "Description:",
                        "children": [
                            {"text": "Implement predictive analytics to identify at-risk customers 30 days before churn"}
                        ]
                    },
                    {
                        "text": "Evidence:",
                        "children": [
                            {"text": "Companies using predictive churn models see 20-25% reduction in attrition"},
                            {"text": "Early intervention increases retention success rate by 3x"},
                            {"text": "Average ROI of $5 for every $1 spent on retention"}
                        ]
                    },
                    {
                        "text": "Implementation Levers:",
                        "children": [
                            {"text": "Deploy ML model on 24 months of customer behavior data"},
                            {"text": "Create automated intervention workflows"},
                            {"text": "Establish real-time alerting system"}
                        ]
                    }
                ]
            }
        ],
        "suggestions": [
            "Would you like to add specific metrics for measuring success?",
            "Should we include a timeline for implementation?",
            "Do you want to add risk factors to consider?"
        ]
    },
    "edit_purpose": {
        "content": "To determine whether to maintain our current per-seat pricing model or transition to usage-based pricing by Q2 2024, based on competitive analysis and customer feedback from our enterprise segment",
        "suggestions": [
            "Add specific decision criteria",
            "Include key stakeholders who need to approve",
            "Define what success looks like"
        ]
    },
    "research_market": {
        "content": "Based on current market analysis:",
        "citations": [
            {
                "text": "61% of SaaS companies have adopted or are transitioning to usage-based pricing",
                "source": "OpenView Partners State of SaaS Pricing 2024",
                "url": "https://example.com/report"
            },
            {
                "text": "Enterprise buyers show 2.3x preference for predictable per-seat costs",
                "source": "Gartner SaaS Buying Behavior Survey",
                "url": "https://example.com/gartner"
            }
        ],
        "suggestions": [
            "Would you like me to research competitor pricing models?",
            "Should I analyze your current customer usage patterns?"
        ]
    }
}

def get_mock_response(action: LLMActionRequest) -> Dict[str, Any]:
    """
    Get a mock response based on the action type and prompt content.
    In production, this would call the actual LLM API.
    """
    prompt_lower = action.userPrompt.lower()
    
    # Simple keyword matching for mock responses
    if action.type == "create":
        if "spov" in prompt_lower or "retention" in prompt_lower or "churn" in prompt_lower:
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

async def call_llm_api(action: LLMActionRequest, outline_context: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Call the actual LLM API (OpenAI, Anthropic, etc.)
    This is where you'd integrate with real AI services.
    """
    # Check for API keys
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if not openai_key:
        # No API key configured, use mock responses
        print("No OpenAI API key found, using mock responses")
        return get_mock_response(action)
    
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_key)
        
        # Build the prompt based on action type
        system_prompt = """You are an AI assistant helping users create and edit business documents called Brainlifts. 
        You must respond in valid JSON format. Be concise and professional."""
        
        if action.type == "create":
            if "spov" in action.userPrompt.lower() or action.section == "spov":
                user_prompt = f"""Create a Strategic Point of View (SPOV) based on this request: {action.userPrompt}
                
                Respond with this EXACT JSON structure:
                {{
                    "items": [{{
                        "text": "[SPOV Title]",
                        "children": [
                            {{
                                "text": "Description:",
                                "children": [{{"text": "[One clear sentence describing the strategic view]"}}]
                            }},
                            {{
                                "text": "Evidence:",
                                "children": [
                                    {{"text": "[Specific data point or statistic 1]"}},
                                    {{"text": "[Specific data point or statistic 2]"}},
                                    {{"text": "[Specific data point or statistic 3]"}}
                                ]
                            }},
                            {{
                                "text": "Implementation Levers:",
                                "children": [
                                    {{"text": "[Concrete action 1]"}},
                                    {{"text": "[Concrete action 2]"}},
                                    {{"text": "[Concrete action 3]"}}
                                ]
                            }}
                        ]
                    }}],
                    "suggestions": [
                        "[Follow-up question 1]",
                        "[Follow-up question 2]"
                    ]
                }}"""
            else:
                user_prompt = f"""Create content for this request: {action.userPrompt}
                
                Respond with this JSON structure:
                {{
                    "items": [{{
                        "text": "[Main content]",
                        "children": []
                    }}],
                    "suggestions": ["[Follow-up question]"]
                }}"""
        
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
            return get_mock_response(action)
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",  # Using GPT-4 for better structured output
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}  # Force JSON response
        )
        
        # Parse the response
        response_text = response.choices[0].message.content
        print(f"Raw LLM response: {response_text[:500]}...")  # Log first 500 chars
        
        try:
            result = json.loads(response_text)
            return result
        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response as JSON: {e}")
            print(f"Response was: {response_text}")
            # Fall back to mock response if parsing fails
            return get_mock_response(action)
            
    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        # Fall back to mock response on error
        return get_mock_response(action)

@router.post("", response_model=LLMActionResponse)
async def process_llm_action(
    outline_id: str,
    request: LLMActionRequest,
    current_user: dict = Depends(get_current_user)
) -> LLMActionResponse:
    """
    Process an LLM action for an outline.
    
    This endpoint handles three types of actions:
    - create: Generate new content based on a prompt
    - edit: Modify existing content
    - research: Find information and citations
    """
    try:
        # TODO: Load outline context from database
        # outline = await get_outline(outline_id, current_user["id"])
        outline_context = None  # Placeholder
        
        # Call LLM API or use mock response
        result = await call_llm_api(request, outline_context)
        
        # Log the action for analytics/debugging
        print(f"LLM Action: {request.type} for outline {outline_id}")
        print(f"Prompt: {request.userPrompt[:100]}...")
        
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
    current_user: dict = Depends(get_current_user)
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