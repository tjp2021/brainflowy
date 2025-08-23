#!/bin/bash

# Clean up old test data
echo "Cleaning up old test data..."

# Create a new outline with SPOV section
echo "Creating new outline with sections..."
OUTLINE_RESPONSE=$(curl -s -X POST "http://localhost:8001/api/v1/outlines" \
  -H "Content-Type: application/json" \
  -H "X-Test-User-Id: test-user-123" \
  -d '{
    "title": "Test Outline with SPOV"
  }')

OUTLINE_ID=$(echo $OUTLINE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Created outline: $OUTLINE_ID"

# Add SPOV section
echo "Adding SPOV section..."
curl -s -X POST "http://localhost:8001/api/v1/outlines/$OUTLINE_ID/items" \
  -H "Content-Type: application/json" \
  -H "X-Test-User-Id: test-user-123" \
  -d '{
    "content": "Strategic Points of View (SPOVs)",
    "style": "heading1"
  }' > /dev/null

# Add Purpose section
echo "Adding Purpose section..."
curl -s -X POST "http://localhost:8001/api/v1/outlines/$OUTLINE_ID/items" \
  -H "Content-Type: application/json" \
  -H "X-Test-User-Id: test-user-123" \
  -d '{
    "content": "Purpose",
    "style": "heading1"
  }' > /dev/null

# Test LLM action
echo "Testing LLM action for SPOV..."
LLM_RESPONSE=$(curl -s -X POST "http://localhost:8001/api/v1/outlines/$OUTLINE_ID/llm-action" \
  -H "Content-Type: application/json" \
  -H "X-Test-User-Id: test-user-123" \
  -d '{
    "type": "create",
    "section": "spov",
    "userPrompt": "Create a spiky POV about the importance of continuous integration in software development"
  }')

echo "LLM Response:"
echo $LLM_RESPONSE | python3 -m json.tool | head -20

# Check if items were returned
if echo $LLM_RESPONSE | grep -q "items"; then
  echo "✅ LLM returned items successfully"
else
  echo "❌ LLM did not return items"
fi

# Get the updated outline
echo ""
echo "Getting updated outline items..."
ITEMS=$(curl -s -X GET "http://localhost:8001/api/v1/outlines/$OUTLINE_ID/items" \
  -H "X-Test-User-Id: test-user-123")

echo "Outline items:"
echo $ITEMS | python3 -m json.tool | head -30

echo ""
echo "Test complete. Outline ID: $OUTLINE_ID"
echo "Open browser console and try the LLM Assistant to see if items are added to the outline."
