# BrainFlowy Backend

## Current Status: Backend Implementation COMPLETE ✅

FastAPI backend for BrainFlowy - a hierarchical note-taking application with voice input.

### What's Been Built
- ✅ Complete FastAPI application structure
- ✅ Authentication with JWT tokens
- ✅ Outline CRUD operations with hierarchical data
- ✅ Voice transcription and AI structuring endpoints
- ✅ Azure Cosmos DB integration
- ✅ All tests passing (TDD approach)

## Quick Start

### Option 1: Using the run script (Recommended)
```bash
./run.sh
```

This will:
1. Create a virtual environment
2. Install stable dependencies
3. Start the FastAPI server on http://localhost:8000

### Option 2: Manual setup
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (stable versions only)
pip install -r requirements-test.txt

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Option 3: Using Docker
```bash
# From project root
docker-compose up
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Database Setup

Using Azure Cosmos DB for document storage:

### Local Development (Cosmos DB Emulator)
```bash
# Start Cosmos DB emulator
docker-compose up cosmosdb

# The backend will auto-create database and containers on startup
```

### Production (Azure Cosmos DB)
1. Create a Cosmos DB account on Azure (Free tier available)
2. Update `.env` with your connection details
3. The backend auto-creates containers with proper partition keys

## Environment Variables

```bash
# Copy example file
cp .env.example .env

# Key variables:
COSMOS_ENDPOINT=https://localhost:8081  # Emulator default
COSMOS_KEY=<emulator-key>               # Default key provided
SECRET_KEY=<your-secret-key>            # Change in production!
```

## Running Tests

```bash
# Run all tests
./run_tests.sh

# Run specific test categories
pytest tests/test_auth.py -v        # Authentication only
pytest tests/test_outlines.py -v    # Outlines only
pytest tests/test_voice.py -v       # Voice/AI only
pytest tests/test_integration.py -v # Integration tests

# Run with coverage
pytest --cov=app --cov-report=html
```

## Test Categories

### Authentication (`test_auth.py`)
- User registration
- Login/logout
- Token refresh
- Current user endpoint
- Error handling for duplicates and invalid credentials

### Outlines (`test_outlines.py`)
- CRUD operations for outlines
- CRUD operations for outline items
- Hierarchical structure management
- Indent/outdent functionality
- Parent-child relationships

### Voice/AI (`test_voice.py`)
- Audio transcription
- Text structuring
- Outline improvement
- Voice command processing
- End-to-end voice workflow

### Integration (`test_integration.py`)
- Complete user journey
- Voice-to-outline workflow
- Collaboration features
- Performance requirements

## API Contract

The tests define these endpoints that must be implemented:

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh token

### Outlines
- `GET /outlines` - List user's outlines
- `POST /outlines` - Create outline
- `GET /outlines/{id}` - Get specific outline
- `PUT /outlines/{id}` - Update outline
- `DELETE /outlines/{id}` - Delete outline

### Outline Items
- `GET /outlines/{id}/items` - Get items (hierarchical)
- `POST /outlines/{id}/items` - Create item
- `PUT /outlines/{id}/items/{itemId}` - Update item
- `DELETE /outlines/{id}/items/{itemId}` - Delete item
- `POST /outlines/{id}/items/{itemId}/indent` - Indent item
- `POST /outlines/{id}/items/{itemId}/outdent` - Outdent item
- `POST /outlines/{id}/items/bulk` - Bulk create items

### Voice/AI
- `POST /voice/transcribe` - Transcribe audio
- `POST /voice/structure` - Structure text into outline
- `POST /voice/improve` - Improve outline structure
- `PUT /outlines/{id}/voice` - Update outline with voice command

## Expected Response Formats

All responses match the frontend mock services exactly. See `tests/fixtures/mock_data.py` for the data structures.

## Architecture Decision: Cosmos DB

We're using Azure Cosmos DB instead of PostgreSQL for:
- Perfect JSON alignment with outline structure
- Single-digit latency for point reads
- No ORM complexity
- Free tier scalability

See `/docs/BACKEND_ARCHITECTURE.md` for detailed architecture documentation.

## Next Steps

1. **Create FastAPI application** matching the test contracts
2. **Implement endpoints** with in-memory storage first
3. **Run tests** until all pass
4. **Add Cosmos DB** as storage layer
5. **Deploy** to Azure

## Dependencies

```bash
pip install -r requirements.txt
```

Key packages:
- FastAPI - Web framework
- Pydantic - Data validation
- pytest - Testing framework
- httpx - Async HTTP client for tests
- python-jose - JWT handling
- passlib - Password hashing

## Development Tips

1. **Start simple**: Implement with in-memory dictionaries first
2. **Follow the tests**: Each test failure tells you what to implement
3. **Match mock behavior**: Response structure must match exactly
4. **Use Pydantic models**: Define models matching TypeScript interfaces
5. **Keep it stateless**: Design for horizontal scaling

---

*The frontend is already working with mock services. Our job is to replace those mocks with real implementations that behave identically.*