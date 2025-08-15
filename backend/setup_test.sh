#!/bin/bash

echo "Setting up test environment for BrainFlowy backend..."

# Use Python 3.12 explicitly
PYTHON_CMD="/opt/homebrew/bin/python3.12"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install test dependencies
echo "Installing test dependencies..."
pip install -r requirements-test.txt

echo "Setup complete! Running tests..."
echo "================================"

# Run tests with verbose output
pytest -v --tb=short