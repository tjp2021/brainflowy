#!/usr/bin/env python3
"""
Test error handling and edge cases
"""
import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8001"

async def test_error_handling():
    print("=" * 50)
    print("ERROR HANDLING & EDGE CASES TEST")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        # Test 1: Invalid login credentials
        print("\n1. Testing invalid login...")
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={
                    "email": "nonexistent@example.com",
                    "password": "WrongPassword123!"
                }
            )
            if response.status_code == 401:
                print("✓ Invalid login rejected (401)")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 2: Duplicate user registration
        print("\n2. Testing duplicate user registration...")
        test_email = f"duplicate_{datetime.now().timestamp()}@example.com"
        
        # First registration
        await client.post(
            f"{BASE_URL}/api/v1/auth/register",
            json={
                "email": test_email,
                "password": "TestPass123!",
                "displayName": "Test User"
            }
        )
        
        # Try duplicate
        try:
            dup_response = await client.post(
                f"{BASE_URL}/api/v1/auth/register",
                json={
                    "email": test_email,
                    "password": "TestPass123!",
                    "displayName": "Duplicate User"
                }
            )
            if dup_response.status_code == 400:
                print("✓ Duplicate registration rejected (400)")
            else:
                print(f"❌ Unexpected status: {dup_response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 3: Unauthorized access (no token)
        print("\n3. Testing unauthorized access...")
        try:
            response = await client.get(f"{BASE_URL}/api/v1/outlines")
            if response.status_code == 401:
                print("✓ Unauthorized access rejected (401)")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 4: Invalid token
        print("\n4. Testing invalid token...")
        try:
            response = await client.get(
                f"{BASE_URL}/api/v1/outlines",
                headers={"Authorization": "Bearer invalid_token_12345"}
            )
            if response.status_code == 401:
                print("✓ Invalid token rejected (401)")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Setup valid user for remaining tests
        print("\n5. Setting up valid user for edge case tests...")
        reg_response = await client.post(
            f"{BASE_URL}/api/v1/auth/register",
            json={
                "email": f"edge_{datetime.now().timestamp()}@example.com",
                "password": "TestPass123!",
                "displayName": "Edge Test User"
            }
        )
        auth_data = reg_response.json()
        token = auth_data["accessToken"]
        user_id = auth_data["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✓ User created")
        
        # Test 5: Access non-existent outline
        print("\n6. Testing access to non-existent outline...")
        try:
            response = await client.get(
                f"{BASE_URL}/api/v1/outlines/fake_outline_12345/items",
                headers=headers
            )
            if response.status_code == 404:
                print("✓ Non-existent outline rejected (404)")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Create outline for more tests
        outline_response = await client.post(
            f"{BASE_URL}/api/v1/outlines",
            headers=headers,
            json={
                "title": "Edge Case Test",
                "userId": user_id
            }
        )
        outline_id = outline_response.json()["id"]
        
        # Test 6: Create item with invalid parent
        print("\n7. Testing item with invalid parent ID...")
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
                headers=headers,
                json={
                    "content": "Orphan Item",
                    "parentId": "fake_parent_12345",
                    "style": "normal"
                }
            )
            # This might succeed but create orphaned item
            if response.status_code in [201, 400]:
                print("✓ Invalid parent handled")
            else:
                print(f"⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 7: Empty content
        print("\n8. Testing empty content...")
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
                headers=headers,
                json={
                    "content": "",
                    "parentId": None,
                    "style": "normal"
                }
            )
            if response.status_code == 201:
                print("✓ Empty content allowed (frontend should handle)")
            elif response.status_code == 400:
                print("✓ Empty content rejected (400)")
            else:
                print(f"⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 8: Very long content
        print("\n9. Testing very long content...")
        long_content = "A" * 10000  # 10,000 characters
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
                headers=headers,
                json={
                    "content": long_content,
                    "parentId": None,
                    "style": "normal"
                }
            )
            if response.status_code == 201:
                print("✓ Long content accepted")
            elif response.status_code == 400:
                print("✓ Long content rejected (400)")
            else:
                print(f"⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 9: Invalid style
        print("\n10. Testing invalid style...")
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
                headers=headers,
                json={
                    "content": "Invalid Style Item",
                    "parentId": None,
                    "style": "invalid_style_xyz"
                }
            )
            # Should still work, just use the invalid style or default
            if response.status_code == 201:
                item = response.json()
                print(f"✓ Invalid style handled (stored as: {item.get('style')})")
            else:
                print(f"⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 10: Update non-existent item
        print("\n11. Testing update of non-existent item...")
        try:
            response = await client.put(
                f"{BASE_URL}/api/v1/outlines/{outline_id}/items/fake_item_12345",
                headers=headers,
                json={
                    "content": "Updated content",
                    "style": "normal"
                }
            )
            if response.status_code == 404:
                print("✓ Non-existent item update rejected (404)")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 11: Delete non-existent item
        print("\n12. Testing delete of non-existent item...")
        try:
            response = await client.delete(
                f"{BASE_URL}/api/v1/outlines/{outline_id}/items/fake_item_12345",
                headers=headers
            )
            if response.status_code in [204, 404]:
                print("✓ Non-existent item delete handled")
            else:
                print(f"⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 12: Malformed JSON
        print("\n13. Testing malformed JSON...")
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                content='{"email": "test@example.com", "password": }',  # Invalid JSON
                headers={"Content-Type": "application/json"}
            )
            if response.status_code in [400, 422]:
                print("✓ Malformed JSON rejected")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 13: Missing required fields
        print("\n14. Testing missing required fields...")
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/outlines/{outline_id}/items",
                headers=headers,
                json={
                    # Missing 'content' field
                    "parentId": None,
                    "style": "normal"
                }
            )
            if response.status_code in [400, 422]:
                print("✓ Missing required field rejected")
            else:
                print(f"⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("\n" + "=" * 50)
        print("✅ Error handling tests complete!")
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test_error_handling())