# BrainFlowy Server Setup Guide

## Quick Start (TL;DR)

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend (with testing mode)
cd backend
source venv/bin/activate
TESTING=true python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Access the app at: http://localhost:5173/

## Complete Setup Instructions

### Prerequisites

- Node.js (v18+)
- Python 3.12+
- npm (v9+)

### Initial Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd brainflowy
```

2. **Install Frontend Dependencies**
```bash
npm install
```

3. **Setup Backend Virtual Environment**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Running the Application

### Option 1: Using npm scripts (Recommended for Development)

```bash
# Build frontend (if needed)
npm run build

# Run both frontend and backend together
npm run dev
```

**Note**: The npm script for backend may fail due to workspace configuration. If so, use Option 2.

### Option 2: Running Servers Separately (More Reliable)

#### Frontend Server
```bash
# From project root
npm run dev:frontend
# OR
npm run dev
```

Frontend will be available at: **http://localhost:5173/**

#### Backend Server

```bash
# From project root
cd backend
source venv/bin/activate

# For local development with mock data (RECOMMENDED)
TESTING=true python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# For production with real Cosmos DB (requires Azure setup)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Backend API will be available at: **http://localhost:8001/**

## Common Issues and Solutions

### Issue 1: DnD Kit Import Errors

**Error**: `The requested module '@dnd-kit/core' does not provide an export named 'DragEndEvent'`

**Solution**: Import types properly with `type` keyword:
```typescript
import {
  DndContext,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
```

### Issue 2: Tailwind CSS Not Loading

**Symptoms**: No styling appears, console warns about missing content configuration

**Solutions**:
1. Ensure `tailwind.config.js` has correct content paths:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
}
```

2. Rebuild the project:
```bash
npm run build
npm run dev
```

3. Check that `src/index.css` imports Tailwind:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Issue 3: Backend Cosmos DB Connection Error

**Error**: `Cannot connect to host localhost:8081`

**Solution**: Run backend in TESTING mode to use mock data:
```bash
TESTING=true python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Issue 4: Python Module Not Found

**Error**: `No module named uvicorn`

**Solution**: Activate virtual environment and install dependencies:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Issue 5: npm Workspace Error

**Error**: `npm error No workspaces found: --workspace=backend`

**Solution**: Run backend directly with Python instead of npm scripts (see Option 2 above)

### Issue 6: Port Already in Use

**Solution**: Kill the process using the port:
```bash
# Find process using port 8001
lsof -i :8001
# Kill the process
kill -9 <PID>
```

## Environment Variables

### Backend (.env file in backend directory)

```env
# For local development
TESTING=true

# For production (Azure Cosmos DB)
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE_NAME=BrainFlowy
```

### Frontend

The frontend uses `src/utils/config.ts` to determine the API URL:
- Development: `http://localhost:8001`
- Production: Configure as needed

## Project Structure

```
brainflowy/
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── db/
│   ├── venv/               # Python virtual environment
│   └── requirements.txt
├── package.json            # Root package.json with workspace config
└── SERVER_SETUP.md         # This file
```

## API Endpoints

- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:8001/
- **API Documentation**: http://localhost:8001/docs (FastAPI Swagger UI)

## Development Workflow

1. **Start both servers** (in separate terminals)
2. **Frontend hot-reloads** automatically on file changes
3. **Backend reloads** automatically with `--reload` flag
4. **Test API** directly at http://localhost:8001/docs

## Production Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend
1. Set up Azure Cosmos DB
2. Configure environment variables
3. Deploy using your preferred method (Azure App Service, Docker, etc.)

## Troubleshooting Commands

```bash
# Check if servers are running
ps aux | grep -E "vite|uvicorn"

# Check ports
lsof -i :5173  # Frontend
lsof -i :8001  # Backend

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild frontend
npm run build

# Check Python version
python3 --version

# Recreate virtual environment
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Notes

- Always use port **8001** for backend (frontend expects this)
- Run backend with `TESTING=true` for local development
- The frontend uses Vite for fast HMR (Hot Module Replacement)
- Backend uses FastAPI with automatic API documentation
- Tailwind CSS requires proper configuration in `tailwind.config.js`