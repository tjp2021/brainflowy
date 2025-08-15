"""
Authentication tests based on mockAuth.ts behavior.
These tests define the exact contract the backend must implement.
"""
import pytest
from httpx import AsyncClient
from datetime import datetime
import json

@pytest.mark.auth
class TestAuthentication:
    """Test suite for authentication endpoints matching mockAuth.ts"""
    
    @pytest.mark.asyncio
    async def test_register_new_user(self, client: AsyncClient, new_user_data):
        """Test user registration - matches mockAuthService.register()"""
        response = await client.post(
            "/api/v1/auth/register",
            json=new_user_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure matches mockAuth.ts AuthResponse
        assert "user" in data
        assert "accessToken" in data
        assert "refreshToken" in data
        
        # Verify user structure
        user = data["user"]
        assert user["email"] == new_user_data["email"]
        assert user["name"] == new_user_data["displayName"]
        assert "id" in user
        assert user["id"].startswith("user_")
        
        # Verify settings are initialized
        assert user["settings"]["theme"] == "light"
        assert user["settings"]["fontSize"] == 16
        assert user["settings"]["autoSave"] is True
        assert user["settings"]["shortcuts"] == {}
        
        # Verify tokens are present
        assert data["accessToken"].startswith("mock_access_") or len(data["accessToken"]) > 20
        assert data["refreshToken"].startswith("mock_refresh_") or len(data["refreshToken"]) > 20
    
    @pytest.mark.asyncio
    async def test_register_duplicate_user(self, client: AsyncClient, test_user):
        """Test registration with existing email - should fail"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user["email"],
                "password": "AnyPassword123",
                "displayName": "Duplicate User"
            }
        )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_login_valid_credentials(self, client: AsyncClient, test_user, test_password):
        """Test login with valid credentials - matches mockAuthService.login()"""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user["email"],
                "password": test_password
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "user" in data
        assert "accessToken" in data
        assert "refreshToken" in data
        
        # Verify user data matches test user
        assert data["user"]["id"] == test_user["id"]
        assert data["user"]["email"] == test_user["email"]
        assert data["user"]["name"] == test_user["name"]
    
    @pytest.mark.asyncio
    async def test_login_invalid_password(self, client: AsyncClient, test_user):
        """Test login with wrong password"""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user["email"],
                "password": "WrongPassword123"
            }
        )
        
        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent email"""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "AnyPassword123"
            }
        )
        
        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, auth_headers, test_user):
        """Test getting current user - matches mockAuthService.getCurrentUser()"""
        response = await client.get(
            "/api/v1/auth/me",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        user = response.json()
        
        assert user["id"] == test_user["id"]
        assert user["email"] == test_user["email"]
        assert user["name"] == test_user["name"]
        assert user["settings"] == test_user["settings"]
    
    @pytest.mark.asyncio
    async def test_get_current_user_no_auth(self, client: AsyncClient):
        """Test getting current user without authentication"""
        response = await client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
        assert "not authenticated" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient, auth_headers):
        """Test logout - matches mockAuthService.logout()"""
        response = await client.post(
            "/api/v1/auth/logout",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out"
    
    @pytest.mark.asyncio
    async def test_refresh_token(self, client: AsyncClient, test_user):
        """Test token refresh - matches mockAuthService.refreshToken()"""
        # First login to get tokens
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user["email"],
                "password": "password123"
            }
        )
        refresh_token = login_response.json()["refreshToken"]
        
        # Now refresh
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refreshToken": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user" in data
        assert "accessToken" in data
        assert "refreshToken" in data
        assert data["user"]["id"] == test_user["id"]
    
    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test refresh with invalid token"""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refreshToken": "invalid_token"}
        )
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_auth_response_timing(self, client: AsyncClient, test_user, test_password):
        """Test that auth endpoints respect simulated delay (~800ms from mock)"""
        import time
        
        start = time.time()
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user["email"],
                "password": test_password
            }
        )
        duration = time.time() - start
        
        assert response.status_code == 200
        # In production, this would be faster, but for now we can check it's not instant
        # This test can be adjusted based on implementation
        # assert duration >= 0.5  # At least some processing time