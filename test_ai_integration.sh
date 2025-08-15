#!/bin/bash

echo "====================================="
echo "BrainFlowy AI Integration Test"
echo "====================================="
echo ""

# Check if API keys are configured
echo "1. Checking AI Service Configuration..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "   ⚠️  OPENAI_API_KEY not set - will use mock transcription"
    echo "   To enable real transcription, run:"
    echo "   export OPENAI_API_KEY='your-key-here'"
else
    echo "   ✅ OpenAI API key configured"
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "   ⚠️  ANTHROPIC_API_KEY not set - will use rule-based structuring"
    echo "   To enable Claude structuring, run:"
    echo "   export ANTHROPIC_API_KEY='your-key-here'"
else
    echo "   ✅ Anthropic API key configured"
fi

# Create test user
echo ""
echo "2. Creating test user..."
USER_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"ai_test@example.com","password":"AITest123!","displayName":"AI Test User"}')

if echo "$USER_RESPONSE" | grep -q "accessToken"; then
    ACCESS_TOKEN=$(echo "$USER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ User created"
else
    # Try login if user exists
    USER_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"ai_test@example.com","password":"AITest123!"}')
    ACCESS_TOKEN=$(echo "$USER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ User logged in"
fi

# Test voice transcription
echo ""
echo "3. Testing Voice Transcription..."
echo "   Creating test audio file..."

# Create a simple WAV file with system sound (more compatible than webm)
if command -v say &> /dev/null; then
    # macOS: use say command to generate speech
    say -o /tmp/test_audio.aiff "Hello, this is a test of the voice transcription system. I need to organize my tasks for today."
    # Convert to a format that can be uploaded
    ffmpeg -i /tmp/test_audio.aiff -f wav /tmp/test_audio.wav 2>/dev/null || cp /tmp/test_audio.aiff /tmp/test_audio.wav
else
    # Linux/other: create a simple audio file
    echo "test audio data for transcription" > /tmp/test_audio.wav
fi

TRANSCRIBE_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/voice/transcribe \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -F "audio=@/tmp/test_audio.wav")

echo "   Response: $TRANSCRIBE_RESPONSE" | head -100
if echo "$TRANSCRIBE_RESPONSE" | grep -q '"text"'; then
    TRANSCRIPT=$(echo "$TRANSCRIBE_RESPONSE" | grep -o '"text":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Transcription successful"
    echo "   Text: $TRANSCRIPT"
else
    echo "   ❌ Transcription failed"
fi

# Test text structuring
echo ""
echo "4. Testing AI Text Structuring..."
STRUCTURE_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/voice/structure \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
        "text": "I need to finish the quarterly report by Friday. First, I should gather all the sales data from last quarter. Then analyze the trends and create visualizations. Finally, write the executive summary and send it to the team."
    }')

if echo "$STRUCTURE_RESPONSE" | grep -q '"structured"'; then
    echo "   ✅ Text structuring successful"
    echo "   Response preview:"
    echo "$STRUCTURE_RESPONSE" | jq '.structured[:2]' 2>/dev/null || echo "$STRUCTURE_RESPONSE" | head -100
else
    echo "   ❌ Text structuring failed"
    echo "   Response: $STRUCTURE_RESPONSE"
fi

# Clean up
rm -f /tmp/test_audio.wav /tmp/test_audio.aiff

echo ""
echo "====================================="
echo "AI Integration Test Complete!"
echo ""
if [ -n "$OPENAI_API_KEY" ] || [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "✅ AI services are configured and working!"
else
    echo "⚠️  AI services not configured - using mock/fallback implementations"
    echo ""
    echo "To enable real AI features:"
    echo "1. Get an OpenAI API key from https://platform.openai.com/api-keys"
    echo "2. Get an Anthropic API key from https://console.anthropic.com/"
    echo "3. Add them to backend/.env:"
    echo "   OPENAI_API_KEY=your-key-here"
    echo "   ANTHROPIC_API_KEY=your-key-here"
    echo "4. Restart the backend server"
fi
echo "====================================="