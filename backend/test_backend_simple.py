#!/usr/bin/env python3
"""Simple backend test without pytest complexity"""

import asyncio
import httpx
import json

# Set testing mode before importing app
import os
os.environ["TESTING"] = "true"

from app.main import app

async def test_backend():
    """Test basic backend functionality"""
    
    print("=" * 50)
    print("Testing BrainFlowy Backend")
    print("=" * 50)
    
    # Create test client
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Test root endpoint
        print("\n1. Testing root endpoint...")
        response = await client.get("/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        assert response.status_code == 200
        
        # Test health endpoint
        print("\n2. Testing health endpoint...")
        response = await client.get("/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        assert response.status_code == 200
        
        # Test user registration
        print("\n3. Testing user registration...")
        user_data = {
            "email": "test@example.com",
            "password": "TestPass123!",
            "displayName": "Test User"
        }
        response = await client.post("/api/v1/auth/register", json=user_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   User created: {data['user']['email']}")
            print(f"   Has access token: {'accessToken' in data}")
            access_token = data['accessToken']
        else:
            print(f"   Error: {response.text}")
            access_token = None
        
        # Test login
        print("\n4. Testing login...")
        login_data = {
            "email": "test@example.com",
            "password": "TestPass123!"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Logged in as: {data['user']['email']}")
            access_token = data['accessToken']
        else:
            print(f"   Error: {response.text}")
        
        # Test authenticated endpoint
        if access_token:
            print("\n5. Testing authenticated endpoint...")
            headers = {"Authorization": f"Bearer {access_token}"}
            response = await client.get("/api/v1/auth/me", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   User info retrieved: {response.json()['email']}")
            else:
                print(f"   Error: {response.text}")
        
        # Get current user info first to get the user ID
        user_id = None
        if access_token:
            headers = {"Authorization": f"Bearer {access_token}"}
            user_response = await client.get("/api/v1/auth/me", headers=headers)
            if user_response.status_code == 200:
                user_id = user_response.json()["id"]
        
        # Test outline creation
        if access_token and user_id:
            print("\n6. Testing outline creation...")
            outline_data = {
                "title": "Test Outline",
                "userId": user_id
            }
            headers = {"Authorization": f"Bearer {access_token}"}
            response = await client.post("/api/v1/outlines", json=outline_data, headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                outline = response.json()
                print(f"   Outline created: {outline['title']}")
                print(f"   Outline ID: {outline['id']}")
            else:
                print(f"   Error: {response.text}")
    
    print("\n" + "=" * 50)
    print("✅ Basic backend tests complete!")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test_backend())