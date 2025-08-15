#!/bin/bash

echo "====================================="
echo "BrainFlowy Integration Test"
echo "====================================="
echo ""

# Test backend health
echo "1. Testing Backend Health..."
BACKEND_RESPONSE=$(curl -s http://localhost:8001/health)
if echo $BACKEND_RESPONSE | grep -q "healthy"; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend health check failed"
    echo "   Response: $BACKEND_RESPONSE"
fi

# Test frontend serving
echo ""
echo "2. Testing Frontend Serving..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✅ Frontend is serving (HTTP $FRONTEND_RESPONSE)"
else
    echo "   ❌ Frontend not accessible (HTTP $FRONTEND_RESPONSE)"
fi

# Test CORS by making a cross-origin request
echo ""
echo "3. Testing CORS Configuration..."
CORS_RESPONSE=$(curl -s -H "Origin: http://localhost:5173" \
                     -H "Access-Control-Request-Method: POST" \
                     -H "Access-Control-Request-Headers: Content-Type" \
                     -I http://localhost:8001/api/v1/auth/register 2>/dev/null | grep -i "access-control")
                     
if echo "$CORS_RESPONSE" | grep -q "Access-Control"; then
    echo "   ✅ CORS headers present"
    echo "   $CORS_RESPONSE" | head -3
else
    echo "   ⚠️  CORS headers may need configuration"
fi

# Test API endpoint from frontend origin
echo ""
echo "4. Testing API Registration Endpoint..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:5173" \
    -d '{
        "email": "integration@test.com",
        "password": "IntegrationTest123!",
        "displayName": "Integration Test"
    }')

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
    echo "   ✅ Registration endpoint working"
    echo "   User created with email: integration@test.com"
else
    echo "   ⚠️  Registration response:"
    echo "   $REGISTER_RESPONSE" | jq . 2>/dev/null || echo "   $REGISTER_RESPONSE"
fi

echo ""
echo "====================================="
echo "Integration Test Complete!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8001"
echo "API Docs: http://localhost:8001/docs"
echo "====================================="