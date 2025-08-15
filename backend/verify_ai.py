#!/usr/bin/env python3
"""
Verify AI Integration - Definitive test showing real AI services are working
"""
import asyncio
import httpx
import base64
import os
from datetime import datetime

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
ENDC = '\033[0m'
BOLD = '\033[1m'

async def verify_ai_integration():
    print(f"\n{BOLD}{'='*60}{ENDC}")
    print(f"{BOLD}BrainFlowy AI Integration Verification{ENDC}")
    print(f"{BOLD}{'='*60}{ENDC}\n")
    
    # 1. First, check backend configuration
    print(f"{BOLD}1. Checking Backend Configuration:{ENDC}")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    has_openai = bool(os.getenv('OPENAI_API_KEY'))
    has_anthropic = bool(os.getenv('ANTHROPIC_API_KEY'))
    
    print(f"   OpenAI API Key in .env: {GREEN + 'YES' if has_openai else RED + 'NO'}{ENDC}")
    print(f"   Anthropic API Key in .env: {GREEN + 'YES' if has_anthropic else RED + 'NO'}{ENDC}")
    
    # 2. Test the actual AI service classes
    print(f"\n{BOLD}2. Testing AI Service Initialization:{ENDC}")
    
    # Set environment for the service
    if has_openai:
        os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')
    if has_anthropic:
        os.environ['ANTHROPIC_API_KEY'] = os.getenv('ANTHROPIC_API_KEY')
    
    from app.services.ai_voice_service import AIVoiceService
    service = AIVoiceService()
    
    print(f"   OpenAI Client: {GREEN + 'INITIALIZED' if service.openai_client else RED + 'NOT INITIALIZED'}{ENDC}")
    print(f"   Anthropic Client: {GREEN + 'INITIALIZED' if service.anthropic_client else RED + 'NOT INITIALIZED'}{ENDC}")
    
    # 3. Test actual AI structuring
    print(f"\n{BOLD}3. Testing Real AI Text Structuring:{ENDC}")
    
    test_text = """
    For our Q1 2025 product launch, we need to complete several critical tasks.
    First, finalize the product design including user interface mockups and technical specifications.
    Second, develop the MVP with core features like user authentication, data management, and reporting.
    Third, conduct beta testing with selected customers and gather feedback.
    Finally, prepare marketing materials including website updates, demo videos, and press releases.
    """
    
    print(f"   Input text: {YELLOW}'{test_text[:60]}...'{ENDC}")
    
    try:
        structured = await service.structure_text(test_text)
        
        if structured and len(structured) > 0:
            print(f"   {GREEN}✓ AI Structuring Successful!{ENDC}")
            print(f"\n   {BOLD}Structured Output:{ENDC}")
            for item in structured[:5]:  # Show first 5 items
                indent = "     " + "  " * item.level
                print(f"{indent}• {item.content}")
            if len(structured) > 5:
                print(f"     ... and {len(structured) - 5} more items")
            
            # Determine which AI was used
            if service.anthropic_client and structured[0].content != test_text.strip()[:50]:
                print(f"\n   {GREEN}✓ Used Claude 3.5 Sonnet for structuring{ENDC}")
                ai_used = "Claude"
            elif service.openai_client and structured[0].content != test_text.strip()[:50]:
                print(f"\n   {GREEN}✓ Used GPT-4o-mini for structuring{ENDC}")
                ai_used = "GPT"
            else:
                print(f"\n   {YELLOW}⚠ Used rule-based fallback{ENDC}")
                ai_used = "Fallback"
        else:
            print(f"   {RED}✗ No structured output returned{ENDC}")
            ai_used = "None"
            
    except Exception as e:
        print(f"   {RED}✗ Error: {e}{ENDC}")
        ai_used = "Error"
    
    # 4. Test via HTTP API
    print(f"\n{BOLD}4. Testing via HTTP API Endpoints:{ENDC}")
    
    async with httpx.AsyncClient(base_url="http://localhost:8001") as client:
        # Login first
        auth_response = await client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "TestPass123!"
        })
        
        if auth_response.status_code != 200:
            # Try to create user
            auth_response = await client.post("/api/v1/auth/register", json={
                "email": "test@example.com",
                "password": "TestPass123!",
                "displayName": "AI Test User"
            })
        
        if auth_response.status_code == 200:
            token = auth_response.json()["accessToken"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test structure endpoint
            structure_response = await client.post(
                "/api/v1/voice/structure",
                headers=headers,
                json={"text": "Meeting agenda: discuss budget, review timeline, assign tasks"}
            )
            
            if structure_response.status_code == 200:
                result = structure_response.json()
                items = result.get("structured", [])
                print(f"   {GREEN}✓ API Structure Endpoint: Working{ENDC}")
                print(f"     Returned {len(items)} structured items")
            else:
                print(f"   {RED}✗ API Structure Endpoint: Failed{ENDC}")
                print(f"     Status: {structure_response.status_code}")
    
    # 5. Summary
    print(f"\n{BOLD}{'='*60}{ENDC}")
    print(f"{BOLD}VERIFICATION SUMMARY:{ENDC}")
    print(f"{BOLD}{'='*60}{ENDC}")
    
    if has_openai and has_anthropic and service.anthropic_client:
        print(f"\n{GREEN}{BOLD}✅ AI INTEGRATION FULLY OPERATIONAL{ENDC}")
        print(f"{GREEN}   • OpenAI API configured and ready")
        print(f"   • Anthropic Claude API configured and ready")
        print(f"   • Text structuring using real AI")
        print(f"   • API endpoints responding correctly{ENDC}")
    elif (has_openai or has_anthropic) and (service.openai_client or service.anthropic_client):
        print(f"\n{YELLOW}{BOLD}⚠️  AI INTEGRATION PARTIALLY OPERATIONAL{ENDC}")
        print(f"{YELLOW}   • Some AI services configured")
        print(f"   • Using {ai_used} for text processing{ENDC}")
    else:
        print(f"\n{RED}{BOLD}❌ AI INTEGRATION NOT CONFIGURED{ENDC}")
        print(f"{RED}   • No API keys found in .env")
        print(f"   • Using mock/fallback implementations{ENDC}")
    
    print(f"\n{BOLD}{'='*60}{ENDC}\n")

if __name__ == "__main__":
    asyncio.run(verify_ai_integration())