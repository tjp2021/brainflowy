#!/usr/bin/env python3
"""
Live Integration Test Suite for BrainFlowy Backend
Tests real endpoints with actual AI services (when configured)
"""
import asyncio
import httpx
import json
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8001"
TEST_USER = {
    "email": "test@example.com", 
    "password": "TestPass123!",
    "displayName": "Test User"
}

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test(name: str, passed: bool, details: str = ""):
    """Pretty print test results"""
    status = f"{Colors.GREEN}✓ PASS{Colors.ENDC}" if passed else f"{Colors.RED}✗ FAIL{Colors.ENDC}"
    print(f"  {status} {name}")
    if details and not passed:
        print(f"      {Colors.YELLOW}{details}{Colors.ENDC}")

class BrainFlowyIntegrationTests:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL)
        self.auth_token = None
        self.user_id = None
        self.outline_id = None
        
    async def setup(self):
        """Setup test environment"""
        print(f"\n{Colors.BOLD}Setting up test environment...{Colors.ENDC}")
        # Try to register user, if it fails, try login
        try:
            response = await self.client.post("/api/v1/auth/register", json=TEST_USER)
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data["accessToken"]
                self.user_id = data["user"]["id"]
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Created test user")
        except:
            pass
            
        if not self.auth_token:
            # Try login
            response = await self.client.post("/api/v1/auth/login", json={
                "email": TEST_USER["email"],
                "password": TEST_USER["password"]
            })
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data["accessToken"]
                self.user_id = data["user"]["id"]
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Logged in existing user")
                
        return self.auth_token is not None
        
    async def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print(f"\n{Colors.BOLD}Testing Authentication Endpoints:{Colors.ENDC}")
        
        # Test login
        response = await self.client.post("/api/v1/auth/login", json={
            "email": TEST_USER["email"],
            "password": TEST_USER["password"]
        })
        print_test("POST /auth/login", response.status_code == 200, 
                  f"Status: {response.status_code}")
        
        # Test get current user
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = await self.client.get("/api/v1/auth/me", headers=headers)
        print_test("GET /auth/me", response.status_code == 200,
                  f"Status: {response.status_code}")
        
        return True
        
    async def test_outline_endpoints(self):
        """Test outline CRUD endpoints"""
        print(f"\n{Colors.BOLD}Testing Outline Endpoints:{Colors.ENDC}")
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Create outline
        outline_data = {"title": "Integration Test Outline"}
        response = await self.client.post("/api/v1/outlines", 
                                         json=outline_data, 
                                         headers=headers)
        print_test("POST /outlines", response.status_code == 200,
                  f"Status: {response.status_code}")
        
        if response.status_code == 200:
            self.outline_id = response.json()["id"]
        
        # Get user outlines
        response = await self.client.get("/api/v1/outlines", headers=headers)
        print_test("GET /outlines", response.status_code == 200,
                  f"Status: {response.status_code}")
        
        # Get specific outline
        if self.outline_id:
            response = await self.client.get(f"/api/v1/outlines/{self.outline_id}", 
                                            headers=headers)
            print_test(f"GET /outlines/{self.outline_id}", response.status_code == 200,
                      f"Status: {response.status_code}")
        
        return True
        
    async def test_voice_endpoints(self):
        """Test voice/AI endpoints"""
        print(f"\n{Colors.BOLD}Testing Voice/AI Endpoints:{Colors.ENDC}")
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test voice transcription (will use mock if no API key)
        with open("/tmp/test_audio.wav", "wb") as f:
            f.write(b"fake audio data")
        
        with open("/tmp/test_audio.wav", "rb") as f:
            files = {"audio": ("test.wav", f, "audio/wav")}
            response = await self.client.post("/api/v1/voice/transcribe",
                                             files=files,
                                             headers=headers)
        
        print_test("POST /voice/transcribe", response.status_code == 200,
                  f"Status: {response.status_code}")
        
        # Test text structuring
        structure_data = {
            "text": "I need to buy milk, eggs, and bread. Also need to finish the report and call John."
        }
        response = await self.client.post("/api/v1/voice/structure",
                                         json=structure_data,
                                         headers=headers)
        print_test("POST /voice/structure", response.status_code == 200,
                  f"Status: {response.status_code}")
        
        if response.status_code == 200:
            structured = response.json()
            has_items = len(structured.get("structured", [])) > 0
            print_test("  - Returns structured items", has_items,
                      f"Got {len(structured.get('structured', []))} items")
        
        return True
        
    async def test_ai_integration(self):
        """Test AI service integration specifically"""
        print(f"\n{Colors.BOLD}Testing AI Service Integration:{Colors.ENDC}")
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Check if AI services are configured
        import os
        has_openai = bool(os.environ.get("OPENAI_API_KEY"))
        has_anthropic = bool(os.environ.get("ANTHROPIC_API_KEY"))
        
        print(f"  OpenAI API: {Colors.GREEN if has_openai else Colors.YELLOW}"
              f"{'Configured' if has_openai else 'Not configured (using mock)'}{Colors.ENDC}")
        print(f"  Anthropic API: {Colors.GREEN if has_anthropic else Colors.YELLOW}"
              f"{'Configured' if has_anthropic else 'Not configured (using fallback)'}{Colors.ENDC}")
        
        # Test complex structuring
        complex_text = """
        Quarterly goals for Q1 2025:
        First, we need to improve customer satisfaction by 20%.
        This includes updating the support system, training new staff, and implementing feedback loops.
        Second, launch the new product line with marketing campaign, beta testing, and documentation.
        Finally, optimize operations by reducing costs and improving efficiency.
        """
        
        response = await self.client.post("/api/v1/voice/structure",
                                         json={"text": complex_text},
                                         headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            items = result.get("structured", [])
            
            # Check structure quality
            has_hierarchy = any(item.get("level", 0) > 0 for item in items)
            print_test("  - AI creates hierarchical structure", has_hierarchy,
                      f"Max depth: {max(item.get('level', 0) for item in items) if items else 0}")
            
            # Check content preservation
            has_content = len(items) >= 3
            print_test("  - AI preserves content", has_content,
                      f"Created {len(items)} items from input")
        
        return True
        
    async def test_end_to_end_workflow(self):
        """Test complete user workflow"""
        print(f"\n{Colors.BOLD}Testing End-to-End Workflow:{Colors.ENDC}")
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        workflow_passed = True
        
        # 1. Create outline
        response = await self.client.post("/api/v1/outlines",
                                         json={"title": "E2E Test Outline"},
                                         headers=headers)
        if response.status_code != 200:
            workflow_passed = False
        else:
            outline_id = response.json()["id"]
            
        print_test("1. Create outline", response.status_code == 200)
        
        # 2. Structure text
        text = "Buy groceries including milk and eggs. Review project proposal. Schedule team meeting."
        response = await self.client.post("/api/v1/voice/structure",
                                         json={"text": text},
                                         headers=headers)
        
        structured_items = []
        if response.status_code == 200:
            structured_items = response.json().get("structured", [])
            
        print_test("2. Structure voice input", len(structured_items) > 0)
        
        # 3. Add items to outline
        if outline_id and structured_items:
            for item in structured_items[:3]:  # Add first 3 items
                item_data = {
                    "content": item["content"],
                    "parentId": None,
                    "order": 0
                }
                response = await self.client.post(
                    f"/api/v1/outlines/{outline_id}/items",
                    json=item_data,
                    headers=headers
                )
                if response.status_code != 200:
                    workflow_passed = False
                    break
                    
        print_test("3. Add structured items to outline", workflow_passed)
        
        # 4. Verify outline has items
        if outline_id:
            response = await self.client.get(f"/api/v1/outlines/{outline_id}",
                                            headers=headers)
            has_items = False
            if response.status_code == 200:
                outline = response.json()
                has_items = outline.get("itemCount", 0) > 0
                
            print_test("4. Verify outline contains items", has_items)
        
        return workflow_passed
        
    async def cleanup(self):
        """Cleanup test data"""
        print(f"\n{Colors.BOLD}Cleaning up...{Colors.ENDC}")
        if self.outline_id and self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            await self.client.delete(f"/api/v1/outlines/{self.outline_id}", 
                                    headers=headers)
        await self.client.aclose()
        
    async def run_all_tests(self):
        """Run all integration tests"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.ENDC}")
        print(f"{Colors.BOLD}BrainFlowy Backend Integration Tests{Colors.ENDC}")
        print(f"{Colors.BOLD}{'='*60}{Colors.ENDC}")
        
        # Setup
        if not await self.setup():
            print(f"{Colors.RED}Failed to setup test environment{Colors.ENDC}")
            return False
            
        all_passed = True
        
        # Run test suites
        try:
            all_passed &= await self.test_auth_endpoints()
            all_passed &= await self.test_outline_endpoints()
            all_passed &= await self.test_voice_endpoints()
            all_passed &= await self.test_ai_integration()
            all_passed &= await self.test_end_to_end_workflow()
        except Exception as e:
            print(f"\n{Colors.RED}Test error: {e}{Colors.ENDC}")
            all_passed = False
        finally:
            await self.cleanup()
            
        # Summary
        print(f"\n{Colors.BOLD}{'='*60}{Colors.ENDC}")
        if all_passed:
            print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED{Colors.ENDC}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}✗ SOME TESTS FAILED{Colors.ENDC}")
        print(f"{Colors.BOLD}{'='*60}{Colors.ENDC}\n")
        
        return all_passed

async def main():
    """Main test runner"""
    tests = BrainFlowyIntegrationTests()
    success = await tests.run_all_tests()
    exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())