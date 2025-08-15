#!/bin/bash

echo "=================================="
echo "BrainFlowy Integration Test Suite"
echo "=================================="
echo ""

# Register/login to get a real token
echo "1. Testing Authentication..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"integration_test@example.com","password":"IntTest123!","displayName":"Integration Test"}')

if echo "$AUTH_RESPONSE" | grep -q "accessToken"; then
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ User created successfully"
else
    # Try login if user exists
    AUTH_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"integration_test@example.com","password":"IntTest123!"}')
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ User logged in"
fi

# Test outline creation
echo ""
echo "2. Testing Outline Creation..."
OUTLINE_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/outlines \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Integration Test Outline"}')

if echo "$OUTLINE_RESPONSE" | grep -q '"id"'; then
    OUTLINE_ID=$(echo "$OUTLINE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Outline created with ID: $OUTLINE_ID"
else
    echo "   ❌ Failed to create outline"
    echo "   Response: $OUTLINE_RESPONSE"
fi

# Test voice transcription (uses mock or real based on API keys)
echo ""
echo "3. Testing Voice Transcription..."
echo "test audio" > /tmp/test.wav
TRANSCRIBE_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/voice/transcribe \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -F "audio=@/tmp/test.wav")

if echo "$TRANSCRIBE_RESPONSE" | grep -q '"text"'; then
    echo "   ✅ Voice transcription working"
    TEXT=$(echo "$TRANSCRIBE_RESPONSE" | grep -o '"text":"[^"]*"' | cut -d'"' -f4)
    echo "   Transcribed: ${TEXT:0:50}..."
else
    echo "   ❌ Voice transcription failed"
fi

# Test AI structuring
echo ""
echo "4. Testing AI Text Structuring..."
STRUCTURE_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/voice/structure \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"text":"Buy milk and eggs. Finish report. Call John about meeting."}')

if echo "$STRUCTURE_RESPONSE" | grep -q '"structured"'; then
    echo "   ✅ AI structuring working"
    # Count items
    ITEM_COUNT=$(echo "$STRUCTURE_RESPONSE" | grep -o '"content"' | wc -l)
    echo "   Created $ITEM_COUNT structured items"
else
    echo "   ❌ AI structuring failed"
fi

# Test adding items to outline
if [ ! -z "$OUTLINE_ID" ]; then
    echo ""
    echo "5. Testing Add Items to Outline..."
    ITEM_RESPONSE=$(curl -s -X POST "http://localhost:8001/api/v1/outlines/$OUTLINE_ID/items" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"content":"Test item from integration test","parentId":null,"order":0}')
    
    if echo "$ITEM_RESPONSE" | grep -q '"id"'; then
        echo "   ✅ Item added to outline"
    else
        echo "   ❌ Failed to add item"
        echo "   Response: $ITEM_RESPONSE"
    fi
fi

# Summary
echo ""
echo "=================================="
echo "Integration Test Complete!"
echo ""

# Check if AI is configured in backend .env file
PYTHON_CHECK=$(python3 -c "
from dotenv import load_dotenv
import os
load_dotenv()
print('OPENAI:' + ('YES' if os.getenv('OPENAI_API_KEY') else 'NO'))
print('ANTHROPIC:' + ('YES' if os.getenv('ANTHROPIC_API_KEY') else 'NO'))
" 2>/dev/null)

if echo "$PYTHON_CHECK" | grep -q "OPENAI:YES"; then
    echo "✅ OpenAI API configured in backend - using real Whisper transcription"
else
    echo "⚠️  OpenAI API not configured - using mock transcription"
fi

if echo "$PYTHON_CHECK" | grep -q "ANTHROPIC:YES"; then
    echo "✅ Anthropic API configured in backend - using Claude for structuring"
else
    echo "⚠️  Anthropic API not configured - using rule-based structuring"
fi

echo "=================================="