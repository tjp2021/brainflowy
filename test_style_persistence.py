#!/usr/bin/env python3
"""
Test script to verify style persistence across sessions
"""
import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8001"

async def test_style_persistence():
    async with httpx.AsyncClient() as client:
        # 1. Register user and create initial session
        print("SESSION 1: Creating user and items with styles...")
        register_response = await client.post(
            f"{BASE_URL}/api/v1/auth/register",
            json={
                "email": f"persist_{datetime.now().timestamp()}@example.com",
                "password": "TestPass123!",
                "displayName": "Style Test User"
            }
        )
        auth_data = register_response.json()
        token1 = auth_data["accessToken"]
        user_id = auth_data["user"]["id"]
        user_email = auth_data["user"]["email"]
        headers1 = {"Authorization": f"Bearer {token1}"}
        
        # Create outline
        outline_response = await client.post(
            f"{BASE_URL}/api/v1/outlines",
            headers=headers1,
            json={
                "title": "Style Persistence Test",
                "userId": user_id
            }
        )
        outline = outline_response.json()
        outline_id = outline["id"]
        print(f"✓ Created outline: {outline['title']}")
        
        # Create items with different styles
        items_created = []
        
        # Header item
        item1 = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers1,
            json={
                "content": "This is a header",
                "parentId": None,
                "style": "header",
                "formatting": None
            }
        )
        items_created.append(item1.json())
        
        # Code item
        item2 = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers1,
            json={
                "content": "const test = 'code block';",
                "parentId": None,
                "style": "code",
                "formatting": None
            }
        )
        items_created.append(item2.json())
        
        # Quote item
        item3 = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers1,
            json={
                "content": "This is a quote",
                "parentId": None,
                "style": "quote",
                "formatting": None
            }
        )
        items_created.append(item3.json())
        
        # Normal item with formatting
        item4 = await client.post(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers1,
            json={
                "content": "Normal text with formatting",
                "parentId": None,
                "style": "normal",
                "formatting": {"bold": True, "italic": True}
            }
        )
        items_created.append(item4.json())
        
        print(f"✓ Created {len(items_created)} items with different styles")
        for item in items_created:
            print(f"  - {item['content'][:30]}... [Style: {item.get('style', 'normal')}]")
        
        # Log out from first session
        await client.post(f"{BASE_URL}/api/v1/auth/logout", headers=headers1)
        print("\n✓ Logged out from Session 1")
        
        # 2. Start new session - login with same user
        print("\nSESSION 2: Logging back in...")
        login_response = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": user_email,
                "password": "TestPass123!"
            }
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
            
        login_data = login_response.json()
        token2 = login_data["accessToken"]
        headers2 = {"Authorization": f"Bearer {token2}"}
        print("✓ Logged in successfully")
        
        # 3. Get outlines
        outlines_response = await client.get(
            f"{BASE_URL}/api/v1/outlines",
            headers=headers2
        )
        outlines = outlines_response.json()
        
        # Find our test outline
        test_outline = None
        for o in outlines:
            if o["id"] == outline_id:
                test_outline = o
                break
        
        if not test_outline:
            print("❌ Could not find test outline!")
            return
        
        print(f"✓ Found outline: {test_outline['title']}")
        
        # 4. Get items and verify styles persisted
        items_response = await client.get(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers2
        )
        retrieved_items = items_response.json()
        
        print("\n✓ Retrieved items with styles:")
        style_check = {
            "header": False,
            "code": False,
            "quote": False,
            "normal": False
        }
        
        for item in retrieved_items:
            style = item.get('style', 'normal')
            formatting = item.get('formatting')
            style_check[style] = True
            
            format_str = ""
            if formatting:
                format_str = f" [Formatting: {json.dumps(formatting)}]"
            
            print(f"  - {item['content'][:30]}... [Style: {style}]{format_str}")
        
        # 5. Verify all styles persisted
        print("\nStyle Persistence Check:")
        all_persisted = True
        for style, found in style_check.items():
            status = "✓" if found else "❌"
            print(f"  {status} {style.capitalize()} style")
            if not found:
                all_persisted = False
        
        if all_persisted:
            print("\n✅ All styles persisted across sessions!")
        else:
            print("\n❌ Some styles were not persisted")
        
        # 6. Update a style and verify in third session
        print("\nSESSION 2: Updating item style...")
        if retrieved_items:
            item_to_update = retrieved_items[0]
            update_response = await client.put(
                f"{BASE_URL}/api/v1/outlines/{outline_id}/items/{item_to_update['id']}",
                headers=headers2,
                json={
                    "content": item_to_update['content'],
                    "style": "quote" if item_to_update.get('style') != 'quote' else 'header',
                    "formatting": {"underline": True}
                }
            )
            if update_response.status_code == 200:
                updated = update_response.json()
                print(f"✓ Updated item style to: {updated.get('style')}")
        
        # Log out from second session
        await client.post(f"{BASE_URL}/api/v1/auth/logout", headers=headers2)
        
        # 7. Third session - verify update persisted
        print("\nSESSION 3: Final verification...")
        login3_response = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": user_email,
                "password": "TestPass123!"
            }
        )
        login3_data = login3_response.json()
        token3 = login3_data["accessToken"]
        headers3 = {"Authorization": f"Bearer {token3}"}
        
        final_items_response = await client.get(
            f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
            headers=headers3
        )
        final_items = final_items_response.json()
        
        if final_items and len(final_items) > 0 and final_items[0].get('formatting') and final_items[0].get('formatting').get('underline'):
            print("✓ Style update persisted across sessions!")
        else:
            print("❌ Style update did not persist")
        
        print("\n✅ Style persistence test complete!")

if __name__ == "__main__":
    asyncio.run(test_style_persistence())