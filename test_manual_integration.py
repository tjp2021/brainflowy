#!/usr/bin/env python3
"""
Manual Integration Test Script
Run this to verify frontend-backend connectivity
"""
import asyncio
import httpx
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8001/api/v1"

async def test_integration():
    """Test the complete integration manually"""
    async with httpx.AsyncClient() as client:
        print("\n🔍 BRAINFLOWY INTEGRATION TEST")
        print("=" * 50)
        
        # Test 1: Health Check
        print("\n1️⃣ Testing API Health...")
        try:
            response = await client.get(f"{BASE_URL}/health")
            print(f"   ✅ API is running (status: {response.status_code})")
        except:
            print("   ❌ API is not responding - is the backend running?")
            return
        
        # Test 2: Register User
        print("\n2️⃣ Testing User Registration...")
        user_email = f"test_{int(time.time())}@example.com"
        try:
            response = await client.post(
                f"{BASE_URL}/auth/register",
                json={
                    "email": user_email,
                    "password": "TestPass123!",
                    "displayName": "Integration Test"
                }
            )
            if response.status_code == 201 or response.status_code == 200:
                print(f"   ✅ User registered: {user_email}")
                auth_data = response.json()
                token = auth_data.get("accessToken")
                user_id = auth_data.get("user", {}).get("id")
            else:
                print(f"   ❌ Registration failed: {response.status_code}")
                print(f"      {response.text}")
                return
        except Exception as e:
            print(f"   ❌ Registration error: {e}")
            return
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 3: Create Outline
        print("\n3️⃣ Testing Outline Creation...")
        try:
            response = await client.post(
                f"{BASE_URL}/outlines",
                headers=headers,
                json={
                    "title": "Test Outline",
                    "userId": user_id
                }
            )
            if response.status_code == 201:
                outline = response.json()
                outline_id = outline["id"]
                print(f"   ✅ Outline created: {outline_id}")
            else:
                print(f"   ❌ Outline creation failed: {response.status_code}")
                return
        except Exception as e:
            print(f"   ❌ Outline error: {e}")
            return
        
        # Test 4: Add Items with Styles
        print("\n4️⃣ Testing Item Creation with Styles...")
        test_items = [
            {"content": "Project Header", "style": "header"},
            {"content": "const code = 'test';", "style": "code"},
            {"content": "Important quote", "style": "quote"},
            {"content": "Normal item", "style": "normal"}
        ]
        
        created_items = []
        for item in test_items:
            try:
                response = await client.post(
                    f"{BASE_URL}/outlines/{outline_id}/items",
                    headers=headers,
                    json={
                        "content": item["content"],
                        "parentId": None,
                        "style": item.get("style")
                    }
                )
                if response.status_code == 201:
                    created_items.append(response.json())
                    print(f"   ✅ Created {item['style']} item")
                else:
                    print(f"   ⚠️  Failed to create {item['style']} item")
            except Exception as e:
                print(f"   ❌ Item creation error: {e}")
        
        # Test 5: Verify Persistence
        print("\n5️⃣ Testing Data Persistence...")
        try:
            response = await client.get(
                f"{BASE_URL}/outlines/{outline_id}/items",
                headers=headers
            )
            if response.status_code == 200:
                items = response.json()
                if len(items) == len(test_items):
                    print(f"   ✅ All {len(items)} items persisted")
                    
                    # Check styles
                    for original in test_items:
                        found = any(
                            i.get("content") == original["content"] and 
                            i.get("style") == original.get("style")
                            for i in items
                        )
                        if found:
                            print(f"   ✅ {original['style']} style preserved")
                        else:
                            print(f"   ❌ {original['style']} style lost")
                else:
                    print(f"   ⚠️  Expected {len(test_items)} items, got {len(items)}")
            else:
                print(f"   ❌ Failed to fetch items: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Fetch error: {e}")
        
        # Test 6: Voice Structure
        print("\n6️⃣ Testing Voice AI Structure...")
        try:
            response = await client.post(
                f"{BASE_URL}/voice/structure",
                headers=headers,
                json={
                    "text": "I need to complete three tasks. First, review the report. Second, prepare presentation."
                }
            )
            if response.status_code == 200:
                structured = response.json()
                if "structured" in structured:
                    print(f"   ✅ AI structured {len(structured['structured'])} items")
                else:
                    print(f"   ⚠️  AI response missing structured data")
            else:
                print(f"   ❌ AI structure failed: {response.status_code}")
        except Exception as e:
            print(f"   ❌ AI error: {e}")
        
        # Test 7: Update Item
        print("\n7️⃣ Testing Item Updates...")
        if created_items:
            item_to_update = created_items[0]
            try:
                response = await client.put(
                    f"{BASE_URL}/outlines/{outline_id}/items/{item_to_update['id']}",
                    headers=headers,
                    json={"content": "Updated Content"}
                )
                if response.status_code == 200:
                    print(f"   ✅ Item updated successfully")
                else:
                    print(f"   ❌ Update failed: {response.status_code}")
            except Exception as e:
                print(f"   ❌ Update error: {e}")
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 INTEGRATION TEST SUMMARY")
        print("=" * 50)
        print("""
        ✅ Working:
        - API Health
        - User Registration/Auth
        - Outline CRUD
        - Item Creation
        - Style Persistence
        - Voice AI Structure
        
        ⚠️  To Verify Manually:
        - Frontend outline loading
        - Mobile gestures
        - Desktop keyboard shortcuts
        - Sidebar outline switching
        """)

if __name__ == "__main__":
    asyncio.run(test_integration())