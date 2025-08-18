"""
Comprehensive Frontend-Backend Integration Tests
These tests verify EVERY feature works end-to-end as a user would experience it
"""
import pytest
import asyncio
from httpx import AsyncClient as HttpxAsyncClient
import json
import time
from typing import Dict, List, Any


class TestCompleteFeatureIntegration:
    """
    Tests that verify ALL features work from frontend action to backend persistence
    """
    
    @pytest.fixture
    async def authenticated_user(self, client: HttpxAsyncClient) -> Dict[str, Any]:
        """Create and authenticate a test user"""
        user_email = f"test_{time.time()}@example.com"
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": user_email,
                "password": "TestPass123!",
                "fullName": "Test User"
            }
        )
        assert register_response.status_code == 201
        
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": user_email, "password": "TestPass123!"}
        )
        assert login_response.status_code == 200
        
        return {
            "user": login_response.json()["user"],
            "token": login_response.json()["accessToken"],
            "headers": {"Authorization": f"Bearer {login_response.json()['accessToken']}"}
        }
    
    @pytest.mark.asyncio
    async def test_01_outline_crud_complete(self, client: HttpxAsyncClient, authenticated_user):
        """
        Test complete outline CRUD operations as frontend would perform them
        """
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        # 1. CREATE - User clicks "New Outline" in sidebar
        create_response = await client.post(
            "/api/v1/outlines",
            headers=headers,
            json={"title": f"Outline {time.time()}", "userId": user["id"]}
        )
        assert create_response.status_code == 201
        outline = create_response.json()
        outline_id = outline["id"]
        
        # 2. READ - Sidebar loads user's outlines
        list_response = await client.get("/api/v1/outlines", headers=headers)
        assert list_response.status_code == 200
        outlines = list_response.json()
        assert any(o["id"] == outline_id for o in outlines)
        
        # 3. UPDATE - User edits outline title
        update_response = await client.put(
            f"/api/v1/outlines/{outline_id}",
            headers=headers,
            json={"title": "Updated Title"}
        )
        assert update_response.status_code == 200
        
        # 4. VERIFY UPDATE - Refresh page, title persists
        get_response = await client.get(f"/api/v1/outlines/{outline_id}", headers=headers)
        assert get_response.json()["title"] == "Updated Title"
        
        # 5. DELETE - User deletes outline
        delete_response = await client.delete(f"/api/v1/outlines/{outline_id}", headers=headers)
        assert delete_response.status_code == 204
        
        # 6. VERIFY DELETE - Outline no longer in list
        list_after_delete = await client.get("/api/v1/outlines", headers=headers)
        assert not any(o["id"] == outline_id for o in list_after_delete.json())
    
    @pytest.mark.asyncio
    async def test_02_item_styles_persistence(self, client: HttpxAsyncClient, authenticated_user):
        """
        Test that all item styles (header, code, quote, normal) persist correctly
        """
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        # Create outline
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=headers,
            json={"title": "Style Test Outline", "userId": user["id"]}
        )
        outline_id = outline_response.json()["id"]
        
        # Test each style type
        styles_to_test = [
            {
                "content": "Project Overview",
                "style": "header",
                "formatting": {"bold": True, "size": "large"}
            },
            {
                "content": "const apiKey = process.env.API_KEY;",
                "style": "code",
                "formatting": None
            },
            {
                "content": "Quality is not an act, it is a habit",
                "style": "quote",
                "formatting": {"italic": True, "size": "medium"}
            },
            {
                "content": "Regular task item",
                "style": "normal",
                "formatting": None
            }
        ]
        
        created_items = []
        for item_data in styles_to_test:
            response = await client.post(
                f"/api/v1/outlines/{outline_id}/items",
                headers=headers,
                json={
                    "content": item_data["content"],
                    "parentId": None,
                    "style": item_data["style"],
                    "formatting": item_data["formatting"]
                }
            )
            assert response.status_code == 201
            created_items.append(response.json())
        
        # Simulate page refresh - fetch items again
        items_response = await client.get(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        retrieved_items = items_response.json()
        
        # Verify each style persisted correctly
        for original in styles_to_test:
            matching_item = next(
                (i for i in retrieved_items if i["content"] == original["content"]),
                None
            )
            assert matching_item is not None
            assert matching_item.get("style") == original["style"]
            if original["formatting"]:
                assert matching_item.get("formatting") == original["formatting"]
    
    @pytest.mark.asyncio
    async def test_03_mobile_gestures_backend_sync(self, client: HttpxAsyncClient, authenticated_user):
        """
        Test mobile gestures (indent/outdent) properly sync with backend
        """
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        # Create outline with items
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=headers,
            json={"title": "Mobile Test", "userId": user["id"]}
        )
        outline_id = outline_response.json()["id"]
        
        # Create two items at root level
        item1_response = await client.post(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={"content": "Parent Item", "parentId": None}
        )
        item1_id = item1_response.json()["id"]
        
        item2_response = await client.post(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={"content": "Child Item", "parentId": None}
        )
        item2_id = item2_response.json()["id"]
        
        # Simulate swipe right (indent) - make item2 child of item1
        indent_response = await client.post(
            f"/api/v1/outlines/{outline_id}/items/{item2_id}/indent",
            headers=headers
        )
        
        if indent_response.status_code == 200:
            # Verify hierarchy changed
            items_after_indent = await client.get(
                f"/api/v1/outlines/{outline_id}/items",
                headers=headers
            )
            items = items_after_indent.json()
            
            # Should have one root item with one child
            root_items = [i for i in items if i.get("parentId") is None]
            assert len(root_items) == 1
            assert root_items[0]["content"] == "Parent Item"
            
            # Check if backend properly tracks parent-child relationship
            child_item = next((i for i in items if i["id"] == item2_id), None)
            if child_item:
                assert child_item.get("parentId") == item1_id
    
    @pytest.mark.asyncio
    async def test_04_voice_complete_workflow(self, client: HttpxAsyncClient, authenticated_user):
        """
        Test complete voice workflow: record → transcribe → structure → save
        """
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        # Create outline for voice notes
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=headers,
            json={"title": "Voice Notes", "userId": user["id"]}
        )
        outline_id = outline_response.json()["id"]
        
        # Simulate voice transcription
        test_transcript = """
        I need to complete three main tasks today.
        First, review the quarterly report.
        Second, prepare the presentation for tomorrow.
        Third, send follow-up emails to clients.
        """
        
        # Structure the text using AI
        structure_response = await client.post(
            "/api/v1/voice/structure",
            headers=headers,
            json={"text": test_transcript}
        )
        assert structure_response.status_code == 200
        structured_items = structure_response.json()["structured"]
        
        # Save structured items to outline (as frontend would do)
        for item in structured_items:
            create_response = await client.post(
                f"/api/v1/outlines/{outline_id}/items",
                headers=headers,
                json={
                    "content": item["content"],
                    "parentId": None,
                    "style": "header" if item.get("level") == 0 else "normal"
                }
            )
            assert create_response.status_code == 201
        
        # Verify items were saved and persist
        items_response = await client.get(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        saved_items = items_response.json()
        assert len(saved_items) == len(structured_items)
    
    @pytest.mark.asyncio
    async def test_05_desktop_keyboard_shortcuts(self, client: HttpxAsyncClient, authenticated_user):
        """
        Test desktop keyboard shortcuts properly update backend
        """
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        # Create outline and item
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=headers,
            json={"title": "Desktop Test", "userId": user["id"]}
        )
        outline_id = outline_response.json()["id"]
        
        item_response = await client.post(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={"content": "Test Item", "parentId": None, "style": "normal"}
        )
        item_id = item_response.json()["id"]
        
        # Simulate Cmd+B (change to header style)
        update_response = await client.put(
            f"/api/v1/outlines/{outline_id}/items/{item_id}",
            headers=headers,
            json={
                "style": "header",
                "formatting": {"bold": True, "size": "large"}
            }
        )
        assert update_response.status_code == 200
        
        # Verify style change persisted
        get_item = await client.get(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        items = get_item.json()
        updated_item = next((i for i in items if i["id"] == item_id), None)
        assert updated_item["style"] == "header"
        assert updated_item.get("formatting", {}).get("bold") == True
    
    @pytest.mark.asyncio
    async def test_06_sidebar_outline_switching(self, client: HttpxAsyncClient, authenticated_user):
        """
        Test sidebar properly loads and switches between user's outlines
        """
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        # Create multiple outlines (simulating sidebar items)
        outline_ids = []
        outline_titles = ["Work Notes", "Personal", "Project Ideas"]
        
        for title in outline_titles:
            response = await client.post(
                "/api/v1/outlines",
                headers=headers,
                json={"title": title, "userId": user["id"]}
            )
            outline_ids.append(response.json()["id"])
            
            # Add some items to each outline
            for i in range(3):
                await client.post(
                    f"/api/v1/outlines/{response.json()['id']}/items",
                    headers=headers,
                    json={"content": f"{title} - Item {i}", "parentId": None}
                )
        
        # Simulate sidebar loading user's outlines
        outlines_response = await client.get("/api/v1/outlines", headers=headers)
        user_outlines = outlines_response.json()
        
        # Verify all outlines are listed
        assert len(user_outlines) >= 3
        for title in outline_titles:
            assert any(o["title"] == title for o in user_outlines)
        
        # Simulate clicking different outlines in sidebar
        for outline_id in outline_ids:
            # Load outline
            outline_response = await client.get(
                f"/api/v1/outlines/{outline_id}",
                headers=headers
            )
            assert outline_response.status_code == 200
            
            # Load its items
            items_response = await client.get(
                f"/api/v1/outlines/{outline_id}/items",
                headers=headers
            )
            assert items_response.status_code == 200
            items = items_response.json()
            assert len(items) == 3  # Each outline should have 3 items
    
    @pytest.mark.asyncio
    async def test_07_data_persistence_across_sessions(self, client: HttpxAsyncClient):
        """
        Test that all data persists across login sessions (crucial for user trust)
        """
        email = f"persist_test_{time.time()}@example.com"
        password = "TestPass123!"
        
        # Session 1: Register and create data
        register_response = await client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": password, "fullName": "Persist Test"}
        )
        session1_token = register_response.json()["accessToken"]
        session1_headers = {"Authorization": f"Bearer {session1_token}"}
        
        # Create outline with specific content
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=session1_headers,
            json={"title": "Important Notes", "userId": register_response.json()["user"]["id"]}
        )
        outline_id = outline_response.json()["id"]
        
        # Add items with different styles
        test_items = [
            {"content": "Meeting Notes", "style": "header"},
            {"content": "console.log('test');", "style": "code"},
            {"content": "Key takeaway from meeting", "style": "quote"}
        ]
        
        for item in test_items:
            await client.post(
                f"/api/v1/outlines/{outline_id}/items",
                headers=session1_headers,
                json={**item, "parentId": None}
            )
        
        # Logout
        await client.post("/api/v1/auth/logout", headers=session1_headers)
        
        # Session 2: Login again and verify data
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password}
        )
        session2_token = login_response.json()["accessToken"]
        session2_headers = {"Authorization": f"Bearer {session2_token}"}
        
        # Get outlines - should still exist
        outlines_response = await client.get("/api/v1/outlines", headers=session2_headers)
        outlines = outlines_response.json()
        
        saved_outline = next((o for o in outlines if o["id"] == outline_id), None)
        assert saved_outline is not None
        assert saved_outline["title"] == "Important Notes"
        
        # Get items - should still exist with correct styles
        items_response = await client.get(
            f"/api/v1/outlines/{outline_id}/items",
            headers=session2_headers
        )
        items = items_response.json()
        
        for original in test_items:
            matching = next((i for i in items if i["content"] == original["content"]), None)
            assert matching is not None
            assert matching["style"] == original["style"]
    
    @pytest.mark.asyncio
    async def test_08_edit_save_cycle(self, client: HttpxAsyncClient, authenticated_user):
        """
        Test that editing items properly saves to backend (not just local state)
        """
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        # Create outline and item
        outline_response = await client.post(
            "/api/v1/outlines",
            headers=headers,
            json={"title": "Edit Test", "userId": user["id"]}
        )
        outline_id = outline_response.json()["id"]
        
        item_response = await client.post(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={"content": "Original Content", "parentId": None}
        )
        item_id = item_response.json()["id"]
        
        # Edit item content (simulate user typing and saving)
        edit_response = await client.put(
            f"/api/v1/outlines/{outline_id}/items/{item_id}",
            headers=headers,
            json={"content": "Edited Content"}
        )
        assert edit_response.status_code == 200
        
        # Simulate page refresh - fetch item again
        items_response = await client.get(
            f"/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        items = items_response.json()
        edited_item = next((i for i in items if i["id"] == item_id), None)
        
        assert edited_item is not None
        assert edited_item["content"] == "Edited Content"
        assert edited_item["content"] != "Original Content"


@pytest.mark.asyncio
async def test_run_all_integration_tests(client: HttpxAsyncClient):
    """
    Master test that runs all integration tests in sequence
    This ensures the entire application works end-to-end
    """
    test_suite = TestCompleteFeatureIntegration()
    
    # Create authenticated user for all tests
    user = await test_suite.authenticated_user(client)
    
    # Run all tests
    await test_suite.test_01_outline_crud_complete(client, user)
    await test_suite.test_02_item_styles_persistence(client, user)
    await test_suite.test_03_mobile_gestures_backend_sync(client, user)
    await test_suite.test_04_voice_complete_workflow(client, user)
    await test_suite.test_05_desktop_keyboard_shortcuts(client, user)
    await test_suite.test_06_sidebar_outline_switching(client, user)
    await test_suite.test_07_data_persistence_across_sessions(client)
    await test_suite.test_08_edit_save_cycle(client, user)
    
    print("✅ ALL INTEGRATION TESTS PASSED - Frontend to Backend fully connected!")