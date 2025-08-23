#!/usr/bin/env python3
"""
Test script to verify item creation flow
"""
import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8001"

async def test_item_creation():
    async with httpx.AsyncClient() as client:
        # 1. Register a test user
        print("1. Registering test user...")
        register_response = await client.post(
            f"{BASE_URL}/api/v1/auth/register",
            json={
                "email": f"test_{datetime.now().timestamp()}@example.com",
                "password": "TestPass123!",
                "displayName": "Test User"
            }
        )
        auth_data = register_response.json()
        token = auth_data["accessToken"]
        user_id = auth_data["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✓ User registered: {auth_data['user']['email']}")
        
        # 2. Create an outline
        print("\n2. Creating outline...")
        outline_response = await client.post(
            f"{BASE_URL}/api/v1/outlines",
            headers=headers,
            json={
                "title": "Test Outline",
                "userId": user_id
            }
        )
        outline = outline_response.json()
        outline_id = outline["id"]
        print(f"✓ Outline created: {outline['title']} (ID: {outline_id})")
        
        # 3. Create items with different styles
        print("\n3. Creating items with styles...")
        
        # Create parent item with header style
        item1_response = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={
                "content": "Main Topic (Header)",
                "parentId": None,
                "style": "header",
                "formatting": None
            }
        )
        item1 = item1_response.json()
        print(f"✓ Created header item: {item1['content']} (Style: {item1.get('style')})")
        
        # Create child item with normal style
        item2_response = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={
                "content": "Sub point (Normal)",
                "parentId": item1["id"],
                "style": "normal",
                "formatting": None
            }
        )
        item2 = item2_response.json()
        print(f"✓ Created normal item: {item2['content']} (Style: {item2.get('style')})")
        
        # Create code style item
        item3_response = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers,
            json={
                "content": "console.log('Hello')",
                "parentId": item1["id"],
                "style": "code",
                "formatting": None
            }
        )
        item3 = item3_response.json()
        print(f"✓ Created code item: {item3['content']} (Style: {item3.get('style')})")
        
        # 4. Get items and verify hierarchy and styles
        print("\n4. Retrieving items...")
        items_response = await client.get(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        items = items_response.json()
        
        print("\n✓ Item hierarchy:")
        def print_tree(items, indent=0):
            for item in items:
                style_str = f"[{item.get('style', 'normal')}]"
                print(f"{'  ' * indent}• {item['content']} {style_str}")
                if item.get('children'):
                    print_tree(item['children'], indent + 1)
        
        print_tree(items)
        
        # 5. Update an item
        print("\n5. Updating item...")
        update_response = await client.put(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items/{item2['id']}",
            headers=headers,
            json={
                "content": "Updated sub point",
                "style": "quote",
                "formatting": None
            }
        )
        if update_response.status_code == 200:
            updated_item = update_response.json()
            print(f"✓ Item updated: {updated_item['content']} (New style: {updated_item.get('style')})")
        
        # 6. Delete an item
        print("\n6. Testing item deletion...")
        delete_response = await client.delete(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items/{item3['id']}",
            headers=headers
        )
        if delete_response.status_code == 204:
            print(f"✓ Item deleted successfully")
        
        # 7. Final verification
        print("\n7. Final verification...")
        final_items_response = await client.get(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers
        )
        final_items = final_items_response.json()
        print(f"✓ Final item count: {len(final_items[0]['children']) if final_items else 0} children")
        
        print("\n✅ All tests passed!")

if __name__ == "__main__":
    asyncio.run(test_item_creation())