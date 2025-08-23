#!/usr/bin/env python3
"""
Debug script to trace style persistence issue
"""
import asyncio
import httpx
import json
import time

BASE_URL = "http://localhost:8001/api/v1"

async def debug_styles():
    """Debug style persistence"""
    async with httpx.AsyncClient() as client:
        print("\n🔍 STYLE PERSISTENCE DEBUG")
        print("=" * 50)
        
        # Register user
        user_email = f"debug_{int(time.time())}@example.com"
        response = await client.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": user_email,
                "password": "TestPass123!",
                "displayName": "Debug Test"
            }
        )
        auth_data = response.json()
        token = auth_data.get("accessToken")
        user_id = auth_data.get("user", {}).get("id")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create outline
        response = await client.post(
            f"{BASE_URL}/outlines",
            headers=headers,
            json={"title": "Debug Outline", "userId": user_id}
        )
        outline = response.json()
        outline_id = outline["id"]
        print(f"Created outline: {outline_id}")
        
        # Test each style individually
        styles = ["header", "code", "quote", "normal"]
        
        for style in styles:
            print(f"\n--- Testing {style} style ---")
            
            # Create item with style
            create_data = {
                "content": f"Test {style} content",
                "parentId": None,
                "style": style
            }
            print(f"Creating with: {json.dumps(create_data, indent=2)}")
            
            response = await client.post(
                f"{BASE_URL}/outlines/{outline_id}/items",
                headers=headers,
                json=create_data
            )
            created = response.json()
            print(f"Created response: {json.dumps(created, indent=2)}")
            
            # Fetch immediately
            response = await client.get(
                f"{BASE_URL}/outlines/{outline_id}/items",
                headers=headers
            )
            items = response.json()
            
            # Find our item
            our_item = None
            for item in items:
                if item.get("content") == f"Test {style} content":
                    our_item = item
                    break
            
            if our_item:
                print(f"Retrieved item: {json.dumps(our_item, indent=2)}")
                if our_item.get("style") == style:
                    print(f"✅ {style} style preserved!")
                else:
                    print(f"❌ {style} style lost! Got: {our_item.get('style')}")
            else:
                print(f"❌ Item not found!")

if __name__ == "__main__":
    asyncio.run(debug_styles())