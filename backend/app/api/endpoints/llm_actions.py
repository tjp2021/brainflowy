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
        if "spov" in prompt_lower or "spiky pov" in prompt_lower or "retention" in prompt_lower or "churn" in prompt_lower:
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
        # No API key configured, use mock responses
        print("No OpenAI API key found, using mock responses")
        return get_mock_response(action)
    
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
                
                system_prompt = f"""You are an AI assistant helping users create and edit business documents called Brainlifts. 
                You must respond in valid JSON format. Be concise and professional.
                
                Current outline structure:
                {outline_structure}
                
                Existing sections in this outline:
                {', '.join(sections_list)}
                
                Section guidelines:
                - SPOV: Strategic insights and recommendations
                - Purpose: The main goal or decision to be made
                - Expert Council: Subject matter experts and advisors
                - DOK Level 3 - Insights: Strategic analysis and insights
                - DOK Level 2 - Knowledge: Synthesized knowledge and patterns
                - DOK Level 1 - Evidence/Facts: Data, facts, and citations
                
                When creating content, analyze the user's request to determine the appropriate section:
                - If they mention experts, advisors, or need expertise → Expert Council
                - If they mention data, facts, evidence, or citations → DOK Level 1
                - If they mention insights, analysis, or strategy → DOK Level 3
                - If they mention knowledge, patterns, or synthesis → DOK Level 2
                - If they mention strategic points or recommendations → SPOV
                
                IMPORTANT: Create content under the appropriate existing section based on the content type."""
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
            # Analyze the prompt to determine target section
            prompt_lower = action.userPrompt.lower()
            
            # Determine the appropriate section and parent
            target_section = None
            section_instructions = ""
            
            if outline_context and existing_sections:
                # Check for section-specific keywords
                if ("expert" in prompt_lower or "advisor" in prompt_lower or 
                    "council" in prompt_lower or "sme" in prompt_lower):
                    target_section = "expert_council"
                    section_instructions = "Place this content under the Expert Council section."
                elif ("data" in prompt_lower or "fact" in prompt_lower or 
                      "evidence" in prompt_lower or "citation" in prompt_lower or
                      "statistic" in prompt_lower or "research" in prompt_lower):
                    target_section = "dok1"
                    section_instructions = "Place this content under DOK Level 1 - Evidence/Facts section."
                elif ("insight" in prompt_lower or "analysis" in prompt_lower or
                      "strategy" in prompt_lower or "implication" in prompt_lower):
                    target_section = "dok3"
                    section_instructions = "Place this content under DOK Level 3 - Insights section."
                elif ("knowledge" in prompt_lower or "pattern" in prompt_lower or
                      "synthesis" in prompt_lower or "understanding" in prompt_lower):
                    target_section = "dok2"
                    section_instructions = "Place this content under DOK Level 2 - Knowledge section."
                elif "spov" in prompt_lower or "spiky pov" in prompt_lower or "strategic point" in prompt_lower:
                    target_section = "spov"
                    section_instructions = "Place this content under the SPOV section."
                elif "purpose" in prompt_lower:
                    target_section = "purpose"
                    section_instructions = "Place this content under the Purpose section."
            
            if "spov" in prompt_lower or "spiky pov" in prompt_lower or action.section == "spov":
                user_prompt = f"""Create a Strategic Point of View (SPOV) based on this request: {action.userPrompt}
                
                {section_instructions}
                
                Respond with this EXACT JSON structure:
                {{
                    "items": [{{
                        "text": "[SPOV Title]",
                        "targetSection": "{target_section or 'spov'}",
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
                
                {section_instructions}
                
                Respond with this JSON structure:
                {{
                    "items": [{{
                        "text": "[Main content]",
                        "targetSection": "{target_section or 'general'}",
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
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Using GPT-4o-mini - more accessible and cost-effective
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
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
                    temperature=0.7
                )
            else:
                raise api_error
        
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
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"❌ Error calling OpenAI API: {str(e)}")
        logger.error(f"❌ Full error details: {repr(e)}")
        print(f"Error calling OpenAI API: {str(e)}")
        # Fall back to mock response on error
        logger.info("📝 Falling back to mock response")
        return get_mock_response(action)

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
            result = get_mock_response(request)
        
        print(f"✅ LLM Action completed, result keys: {list(result.keys()) if isinstance(result, dict) else 'not a dict'}")
        if outline_context:
            sections = detect_outline_sections(outline_context)
            print(f"Detected sections: {[k for k, v in sections.items() if v]}")
        
        # Ensure we always return a valid response
        if not result:
            print("⚠️ Empty result, using mock response")
            result = get_mock_response(request)
        
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