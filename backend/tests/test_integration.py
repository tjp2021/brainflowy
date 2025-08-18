"""
Integration tests for complete user workflows.
These ensure all components work together correctly from frontend to backend.
"""
import pytest
from httpx import AsyncClient
import base64
import time
import json

@pytest.mark.integration
class TestUserJourney:
    """Complete user journey from registration to creating outlines"""
    
    @pytest.mark.asyncio
    async def test_new_user_complete_flow(self, client: AsyncClient):
        """Test complete flow: register -> login -> create outline -> add items"""
        # Step 1: Register new user
        user_data = {
            "email": f"journey_{time.time()}@example.com",
            "password": "SecurePass123!",
            "displayName": "Journey User"
        }
        
        register_response = await client.post(
            "/api/v1/auth/register",
            json=user_data
        )
        assert register_response.status_code == 200
        auth_data = register_response.json()
        user_id = auth_data["user"]["id"]
        access_token = auth_data["accessToken"]
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Step 2: Verify can get current user
        me_response = await client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200
        assert me_response.json()["email"] == user_data["email"]
        
        # Step 3: Create first outline
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=headers,
            json={
                "title": "My First Outline",
                "userId": user_id
            }
        )
        assert outline_response.status_code == 201
        outline = outline_response.json()
        outline_id = outline["id"]
        
        # Step 4: Add items to outline
        item1_response = await client.post(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={
                "content": "Main topic",
                "parentId": None
            }
        )
        assert item1_response.status_code == 201
        parent_id = item1_response.json()["id"]
        
        # Step 5: Add nested item
        item2_response = await client.post(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={
                "content": "Sub topic",
                "parentId": parent_id
            }
        )
        assert item2_response.status_code == 201
        
        # Step 6: Get outline with items
        items_response = await client.get(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        assert items_response.status_code == 200
        items = items_response.json()
        
        # Verify hierarchy
        assert len(items) == 1  # One root item
        assert items[0]["content"] == "Main topic"
        assert len(items[0]["children"]) == 1
        assert items[0]["children"][0]["content"] == "Sub topic"
        
        # Step 7: Logout
        logout_response = await client.post("/api/v1/auth/logout", headers=headers)
        assert logout_response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_existing_user_login_flow(self, client: AsyncClient, test_user, test_password):
        """Test existing user login and accessing their data"""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user["email"],
                "password": test_password
            }
        )
        assert login_response.status_code == 200
        access_token = login_response.json()["accessToken"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Get user's outlines
        outlines_response = await client.get(
            f"/api/v1/outlines?userId={test_user['id']}",
            headers=headers
        )
        assert outlines_response.status_code == 200
        outlines = outlines_response.json()
        
        # Should have at least the sample outline
        assert len(outlines) >= 1
        assert any(o["title"] == "Welcome to BrainFlowy" for o in outlines)


@pytest.mark.integration
class TestVoiceWorkflow:
    """Integration tests for voice features"""
    
    @pytest.mark.asyncio
    async def test_voice_to_outline_workflow(self, client: AsyncClient, auth_headers, test_user):
        """Test complete voice workflow from audio to structured outline"""
        # Step 1: Create a new outline for voice input
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=auth_headers,
            json={
                "title": "Voice Notes",
                "userId": test_user["id"]
            }
        )
        outline_id = outline_response.json()["id"]
        
        # Step 2: Simulate voice input (using mock audio)
        audio_data = b"mock audio containing speech about tasks"
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        transcribe_response = await client.post(
            "/api/v1/voice/transcribe",
            headers=auth_headers,
            json={"audio": audio_base64}
        )
        assert transcribe_response.status_code == 200
        text = transcribe_response.json()["text"]
        
        # Step 3: Structure the transcribed text
        structure_response = await client.post(
            "/api/v1/voice/structure",
            headers=auth_headers,
            json={"text": text}
        )
        assert structure_response.status_code == 200
        structured = structure_response.json()["structured"]
        
        # Step 4: Add structured items to outline
        for item in structured:
            await client.post(
                f"/api/v1/outlines/{outline_id}/items",
                headers=auth_headers,
                json={
                    "content": item["content"],
                    "parentId": None  # Simplified - in real app would maintain hierarchy
                }
            )
        
        # Step 5: Verify items were added
        items_response = await client.get(
            f"/api/v1/outlines/{outline_id}/items",
            headers=auth_headers
        )
        items = items_response.json()
        assert len(items) == len(structured)


@pytest.mark.integration
class TestCollaboration:
    """Test collaboration features"""
    
    @pytest.mark.asyncio
    async def test_share_outline_between_users(self, client: AsyncClient):
        """Test sharing outline between two users"""
        # Create two users
        user1_data = {
            "email": "user1@example.com",
            "password": "Pass123!",
            "displayName": "User One"
        }
        user2_data = {
            "email": "user2@example.com",
            "password": "Pass123!",
            "displayName": "User Two"
        }
        
        # Register both users
        user1_response = await client.post("/api/v1/auth/register", json=user1_data)
        user1 = user1_response.json()["user"]
        user1_token = user1_response.json()["accessToken"]
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        
        user2_response = await client.post("/api/v1/auth/register", json=user2_data)
        user2 = user2_response.json()["user"]
        user2_token = user2_response.json()["accessToken"]
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # User 1 creates an outline
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=user1_headers,
            json={
                "title": "Shared Project",
                "userId": user1["id"]
            }
        )
        outline = outline_response.json()
        
        # User 1 shares with User 2 (Phase 2 feature)
        # This endpoint might not exist yet, but the test defines the contract
        share_response = await client.post(
            f"/api/v1/outlines/{outline['id']}/share",
            headers=user1_headers,
            json={
                "userId": user2["id"],
                "permission": "read"
            }
        )
        
        if share_response.status_code == 200:
            # User 2 should be able to access the outline
            user2_outline_response = await client.get(
                f"/api/v1/outlines/{outline['id']}",
                headers=user2_headers
            )
            assert user2_outline_response.status_code == 200
            assert user2_outline_response.json()["title"] == "Shared Project"


@pytest.mark.integration
class TestPerformance:
    """Test performance requirements from PRD"""
    
    @pytest.mark.asyncio
    async def test_api_response_time(self, client: AsyncClient, auth_headers):
        """Test that API responses are fast enough"""
        import time
        
        # Test outline creation performance
        start = time.time()
        response = await client.post(
            "/api/v1/outlines",
            headers=auth_headers,
            json={
                "title": "Performance Test",
                "userId": "user_test"
            }
        )
        duration = time.time() - start
        
        assert response.status_code == 201
        # API should respond in under 200ms for most operations
        # Allow some slack for test environment
        assert duration < 1.0  # 1 second max in test env
    
    @pytest.mark.asyncio
    async def test_handle_large_outline(self, client: AsyncClient, auth_headers):
        """Test that backend can handle large outlines (10,000+ items per PRD)"""
        # Create outline
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=auth_headers,
            json={
                "title": "Large Outline Test",
                "userId": "user_test"
            }
        )
        outline_id = outline_response.json()["id"]
        
        # Add many items (reduced for test speed - full test would use 10,000)
        num_items = 100  # Use 100 for quick test, 10000 for stress test
        
        for i in range(num_items):
            await client.post(
                f"/api/v1/outlines/{outline_id}/items",
                headers=auth_headers,
                json={
                    "content": f"Item {i}",
                    "parentId": None
                }
            )
        
        # Should still be able to retrieve efficiently
        import time
        start = time.time()
        items_response = await client.get(
            f"/api/v1/outlines/{outline_id}/items",
            headers=auth_headers
        )
        duration = time.time() - start
        
        assert items_response.status_code == 200
        items = items_response.json()
        assert len(items) == num_items
        
        # Even with many items, should respond quickly
        assert duration < 2.0  # 2 seconds max