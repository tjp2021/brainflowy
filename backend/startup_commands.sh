#!/bin/bash
echo "=== Starting BrainFlowy Backend Setup ==="
echo "Current directory: $(pwd)"
echo "Contents: $(ls -la)"

# Create virtual environment if it doesn't exist
if [ ! -d "antenv" ]; then
    echo "Creating virtual environment..."
    python -m venv antenv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source antenv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install dependencies
echo "Installing dependencies from requirements-deploy.txt..."
if [ -f "requirements-deploy.txt" ]; then
    pip install -r requirements-deploy.txt
else
    echo "ERROR: requirements-deploy.txt not found!"
    echo "Installing fallback dependencies..."
    pip install fastapi uvicorn azure-cosmos openai anthropic python-jose passlib python-multipart
fi

# Show installed packages
echo "Installed packages:"
pip list

# Start the application
echo "Starting uvicorn..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000