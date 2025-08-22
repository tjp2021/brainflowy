#!/bin/bash
echo "Starting BrainFlowy Backend Setup"
cd /home/site/wwwroot

# Install dependencies
echo "Installing Python dependencies..."
pip install --no-cache-dir -r requirements-deploy.txt

# Start the application
echo "Starting application..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
