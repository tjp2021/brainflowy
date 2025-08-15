#!/bin/bash

echo "==================================="
echo "BrainFlowy Backend Test Setup"
echo "==================================="

# Use Python 3.12 explicitly
PYTHON_CMD="/opt/homebrew/bin/python3.12"

# Check Python version
echo "Python version:"
$PYTHON_CMD --version

# Create virtual environment
echo ""
echo "Creating virtual environment..."
$PYTHON_CMD -m venv venv

# Activate it
echo "Activating venv..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip --quiet

# Install minimal requirements first
echo ""
echo "Installing core dependencies..."
pip install fastapi==0.100.0 pydantic==2.1.1 pydantic-settings==2.0.2 email-validator==2.0.0 python-dotenv==1.0.0 --quiet

# Try the simple test
echo ""
echo "Running structure test..."
python3 test_simple.py

echo ""
echo "==================================="
echo "To run full tests:"
echo "1. source venv/bin/activate"
echo "2. pip install -r requirements-test.txt"
echo "3. pytest -v"
echo "==================================="