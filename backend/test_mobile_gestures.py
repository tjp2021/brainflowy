#!/usr/bin/env python3
"""
Test script to verify mobile gesture operations sync with backend
"""
import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8001"

async def test_mobile_gestures():
    async with httpx.AsyncClient() as client:
        # Setup: Create user and outline
        print("Setting up test environment...")
        register_response = await client.post(
            f"{BASE_URL}/api/v1/auth/register",
            json={
                "email": f"mobile_{datetime.now().timestamp()}@example.com",
                "password": "TestPass123!",
                "displayName": "Mobile Test User"
            }
        )
        auth_data = register_response.json()
        token = auth_data["accessToken"]
        user_id = auth_data["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create outline
        outline_response = await client.post(
            f"{BASE_URL}/api/v1/outlines",
            headers=headers,
            json={
                "title": "Mobile Gestures Test",
                "userId": user_id
            }
        )
        outline = outline_response.json()
        outline_id = outline["id"]
        print(f"✓ Created outline: {outline['title']}")
        
        # Create test items
        print("\nCreating test items...")
        root_item = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={
                "content": "Root Item",
                "parentId": None,
                "style": "normal"
            }
        )
        root_id = root_item.json()["id"]
        
        child_item = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={
                "content": "Child Item",
                "parentId": None,  # Start as sibling
                "style": "normal"
            }
        )
        child_id = child_item.json()["id"]
        print(f"✓ Created root item: {root_id}")
        print(f"✓ Created child item: {child_id}")
        
        # Test 1: Swipe Right - Indent (make child a child of root)
        print("\n1. Testing SWIPE RIGHT (indent)...")
        indent_response = await client.put(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items/{child_id}",
            headers=headers,
            json={
                "content": "Child Item",
                "parentId": root_id,  # Now becomes child of root
                "style": "normal"
            }
        )
        if indent_response.status_code == 200:
            print("✓ Item indented (became child)")
        
        # Verify hierarchy
        items_response = await client.get(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        items = items_response.json()
        has_child = len(items[0].get("children", [])) > 0 if items else False
        print(f"  Verification: Root has children: {has_child}")
        
        # Test 2: Swipe Left - Outdent (make child a sibling again)
        print("\n2. Testing SWIPE LEFT (outdent)...")
        outdent_response = await client.put(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items/{child_id}",
            headers=headers,
            json={
                "content": "Child Item",
                "parentId": None,  # Back to root level
                "style": "normal"
            }
        )
        if outdent_response.status_code == 200:
            print("✓ Item outdented (became sibling)")
        
        # Test 3: Double Tap - Cycle styles
        print("\n3. Testing DOUBLE TAP (cycle styles)...")
        styles = ["normal", "header", "code", "quote"]
        current_style_index = 0
        
        for i in range(4):
            next_style = styles[(current_style_index + 1) % 4]
            style_response = await client.put(
                f"{BASE_URL}/api/v1/outlines/{outline_id}/items/{root_id}",
                headers=headers,
                json={
                    "content": "Root Item",
                    "style": next_style
                }
            )
            if style_response.status_code == 200:
                updated = style_response.json()
                print(f"✓ Style changed to: {updated.get('style')}")
                current_style_index = (current_style_index + 1) % 4
        
        # Test 4: Long Press - Expand/Collapse (simulated by toggling a collapsed state)
        print("\n4. Testing LONG PRESS (expand/collapse)...")
        # Note: Collapse state is typically handled in frontend, but we can test the data structure
        
        # Add children to test expand/collapse
        grandchild = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={
                "content": "Grandchild Item",
                "parentId": root_id,
                "style": "normal"
            }
        )
        print("✓ Added grandchild for expand/collapse test")
        
        # Get items to verify nested structure
        final_items = await client.get(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        final_data = final_items.json()
        
        print("\n5. Final structure verification:")
        def print_tree(items, indent=0):
            for item in items:
                print(f"{'  ' * indent}• {item['content']} [{item.get('style', 'normal')}]")
                if item.get('children'):
                    print_tree(item['children'], indent + 1)
        
        print_tree(final_data)
        
        # Test 5: Gesture combination - indent multiple levels
        print("\n6. Testing multiple indentations...")
        great_grandchild = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={
                "content": "Great Grandchild",
                "parentId": grandchild.json()["id"],
                "style": "code"
            }
        )
        print("✓ Created deeply nested item")
        
        # Final verification
        final_check = await client.get(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        final_structure = final_check.json()
        
        print("\n✅ Mobile gesture backend sync test complete!")
        print("\nFinal hierarchy:")
        print_tree(final_structure)
        
        return True

if __name__ == "__main__":
    asyncio.run(test_mobile_gestures())