#!/usr/bin/env python3
"""Test LLM endpoint locally"""
import asyncio
from app.api.endpoints.llm_actions import call_llm_api, LLMActionRequest

async def test_llm():
    # Create a test request
    request = LLMActionRequest(
        type="create",
        section="spov",
        userPrompt="Create a spiky POV about improving customer retention",
        targetId=None,
        parentId=None,
        currentContent=None
    )
    
    print("Testing LLM API call...")
    result = await call_llm_api(request, None)
    
    print(f"\nResult type: {type(result)}")
    print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'not a dict'}")
    
    if isinstance(result, dict):
        if "items" in result:
            print(f"Items count: {len(result['items'])}")
            if result['items']:
                print(f"First item: {result['items'][0].get('text', 'no text')[:50]}...")
        if "suggestions" in result:
            print(f"Suggestions: {result['suggestions'][:2]}")

if __name__ == "__main__":
    asyncio.run(test_llm())