#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 BrainFlowy Backend Test Suite"
echo "================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -q -r requirements.txt

echo ""
echo "Running tests based on mock service contracts..."
echo ""

# Run different test categories
echo -e "${GREEN}1. Running Authentication Tests${NC}"
pytest tests/test_auth.py -v --tb=short

echo ""
echo -e "${GREEN}2. Running Outline Tests${NC}"
pytest tests/test_outlines.py -v --tb=short

echo ""
echo -e "${GREEN}3. Running Voice/AI Tests${NC}"
pytest tests/test_voice.py -v --tb=short

echo ""
echo -e "${GREEN}4. Running Integration Tests${NC}"
pytest tests/test_integration.py -v --tb=short

echo ""
echo -e "${GREEN}5. Running All Tests with Coverage${NC}"
pytest --cov=app --cov-report=term-missing --cov-report=html

echo ""
echo "================================"
echo -e "${GREEN}✅ Test suite complete!${NC}"
echo ""
echo "Coverage report available at: htmlcov/index.html"
echo ""
echo "These tests define the exact API contract that the backend must implement."
echo "They are based on the frontend mock services and ensure compatibility."