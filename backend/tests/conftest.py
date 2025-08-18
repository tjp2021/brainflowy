"""Pytest configuration and shared fixtures"""
import pytest
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from fixtures.mock_data import (
    TEST_USER, 
    TEST_USER_PASSWORD,
    SAMPLE_OUTLINE,
    SAMPLE_OUTLINE_ITEMS,
    get_auth_response
)

@pytest.fixture
def test_app() -> FastAPI:
    """Create a test FastAPI application"""
    import sys
    import os
    # Add parent directory to path so we can import app
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Set testing mode BEFORE importing app
    os.environ["TESTING"] = "true"
    
    from app.main import app
    from app.core.config import settings
    
    # Set testing mode
    settings.TESTING = True
    
    return app

@pytest.fixture
def client(test_app: FastAPI):
    """Create an async test client"""
    transport = ASGITransport(app=test_app)
    return AsyncClient(transport=transport, base_url="http://test")

@pytest.fixture
def auth_headers() -> dict:
    """Generate auth headers with test token"""
    response = get_auth_response(TEST_USER)
    return {
        "Authorization": f"Bearer {response['accessToken']}"
    }

@pytest.fixture
def test_user():
    """Provide test user data"""
    return TEST_USER

@pytest.fixture
def test_password():
    """Provide test user password"""
    return TEST_USER_PASSWORD

@pytest.fixture
def sample_outline():
    """Provide sample outline data"""
    return SAMPLE_OUTLINE

@pytest.fixture
def sample_outline_items():
    """Provide sample outline items"""
    return SAMPLE_OUTLINE_ITEMS

@pytest.fixture
def new_user_data():
    """Generate data for a new user registration"""
    return {
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "displayName": "New User"
    }

@pytest.fixture
def voice_audio_blob():
    """Mock audio blob for voice testing"""
    return b"mock audio data for testing"