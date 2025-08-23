#!/usr/bin/env python3
"""
Minimal startup test to diagnose Render deployment issues
"""
import sys
import os

print("=" * 50, file=sys.stderr)
print("STARTUP TEST BEGINNING", file=sys.stderr)
print("=" * 50, file=sys.stderr)

# Test basic Python
print(f"Python version: {sys.version}", file=sys.stderr)
print(f"Working directory: {os.getcwd()}", file=sys.stderr)

# Test imports
try:
    import fastapi
    print("✅ FastAPI imported successfully", file=sys.stderr)
except ImportError as e:
    print(f"❌ FastAPI import failed: {e}", file=sys.stderr)

try:
    import uvicorn
    print("✅ Uvicorn imported successfully", file=sys.stderr)
except ImportError as e:
    print(f"❌ Uvicorn import failed: {e}", file=sys.stderr)

try:
    import openai
    print("✅ OpenAI imported successfully", file=sys.stderr)
except ImportError as e:
    print(f"❌ OpenAI import failed: {e}", file=sys.stderr)

# Test environment variables
print("\nEnvironment Variables:", file=sys.stderr)
print(f"PORT: {os.getenv('PORT', 'NOT SET')}", file=sys.stderr)
print(f"OPENAI_API_KEY: {'SET' if os.getenv('OPENAI_API_KEY') else 'NOT SET'}", file=sys.stderr)
print(f"TESTING: {os.getenv('TESTING', 'NOT SET')}", file=sys.stderr)

# Test app import
try:
    from app.main import app
    print("✅ App imported successfully", file=sys.stderr)
except Exception as e:
    print(f"❌ App import failed: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()

print("=" * 50, file=sys.stderr)
print("STARTUP TEST COMPLETE", file=sys.stderr)
print("=" * 50, file=sys.stderr)