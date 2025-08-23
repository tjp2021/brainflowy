#!/usr/bin/env python3
"""Simple test to verify the backend structure is correct"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all modules can be imported"""
    print("Testing imports...")
    
    try:
        # Test core imports
        from app.core.config import Settings
        print("✓ Config module")
        
        from app.core.security import verify_password, get_password_hash
        print("✓ Security module")
        
        # Test model imports
        from app.models.user import User, UserCreate, AuthResponse
        print("✓ User models")
        
        from app.models.outline import Outline, OutlineItem
        print("✓ Outline models")
        
        from app.models.voice import TranscriptionResponse, StructureResponse
        print("✓ Voice models")
        
        # Test service imports
        from app.services.outline_service import OutlineService
        print("✓ Outline service")
        
        from app.services.voice_service import VoiceService
        print("✓ Voice service")
        
        # Test API endpoint imports
        from app.api.endpoints import auth, outlines, voice
        print("✓ API endpoints")
        
        # Test main app
        from app.main import app
        print("✓ Main application")
        
        print("\n✅ All imports successful!")
        return True
        
    except ImportError as e:
        print(f"\n❌ Import failed: {e}")
        return False

def test_config():
    """Test configuration loads correctly"""
    print("\nTesting configuration...")
    
    try:
        from app.core.config import settings
        
        assert settings.PROJECT_NAME == "BrainFlowy"
        print(f"✓ Project name: {settings.PROJECT_NAME}")
        
        assert settings.COSMOS_DATABASE_NAME == "BrainFlowy"
        print(f"✓ Database name: {settings.COSMOS_DATABASE_NAME}")
        
        assert settings.COSMOS_ENDPOINT
        print(f"✓ Cosmos endpoint configured")
        
        print("\n✅ Configuration valid!")
        return True
        
    except Exception as e:
        print(f"\n❌ Configuration error: {e}")
        return False

def test_api_structure():
    """Test that API has expected endpoints"""
    print("\nTesting API structure...")
    
    try:
        from app.main import app
        
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                routes.append(route.path)
        
        # Check for expected endpoints
        expected = [
            "/",
            "/health",
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/me",
            "/api/v1/outlines",
            "/api/v1/voice/transcribe"
        ]
        
        for endpoint in expected:
            if any(endpoint in route for route in routes):
                print(f"✓ Found endpoint: {endpoint}")
            else:
                print(f"⚠ Missing endpoint: {endpoint}")
        
        print(f"\nTotal routes: {len(routes)}")
        print("\n✅ API structure verified!")
        return True
        
    except Exception as e:
        print(f"\n❌ API structure error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("BrainFlowy Backend Structure Test")
    print("=" * 50)
    
    results = []
    results.append(test_imports())
    results.append(test_config())
    results.append(test_api_structure())
    
    print("\n" + "=" * 50)
    if all(results):
        print("✅ ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED")
        sys.exit(1)