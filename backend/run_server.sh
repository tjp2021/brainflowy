#!/bin/bash

echo "Starting BrainFlowy Backend Server..."
echo "===================================="

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Export test mode for local development
export TESTING=true

# Start the server
echo "Server running at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000