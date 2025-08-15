# Backend Architecture Documentation

## Overview
BrainFlowy uses a document-oriented architecture optimized for hierarchical outline data with Azure Cosmos DB as the primary database.

## Architecture Decision: Azure Cosmos DB

### Why Cosmos DB over PostgreSQL
- **Perfect JSON alignment**: Outline data is already hierarchical JSON - no ORM needed
- **Single-digit latency**: Point reads for documents are blazingly fast
- **Simplicity**: No complex queries, joins, or schema migrations
- **Free tier scalability**: Handles significant load even on free tier
- **Built-in features**: Change feed for real-time sync, global distribution ready

### Database Structure

#### Container 1: Users
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "settings": {
    "theme": "light",
    "fontSize": 16,
    "autoSave": true
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```
- **Partition Key**: `/id` (userId)
- **Usage**: Authentication, user preferences, settings
- **Access Pattern**: Rare reads, infrequent updates

#### Container 2: Docs (Outlines)
```json
{
  "id": "outline_456",
  "userId": "user_123",
  "title": "Project Planning",
  "items": [
    {
      "id": "item_1",
      "text": "Main objective",
      "level": 0,
      "children": [
        {
          "id": "item_2",
          "text": "Sub-task",
          "level": 1,
          "children": []
        }
      ]
    }
  ],
  "metadata": {
    "owner": "user_123",
    "sharedWith": ["user_789"],
    "permissions": {
      "user_789": "read"
    },
    "references": ["outline_789"],
    "referencedBy": ["outline_101"]
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```
- **Partition Key**: `/userId` (owner)
- **Usage**: All outline data and hierarchy
- **Access Pattern**: Frequent reads/writes
- **Benefits**: Natural data isolation per user, fast point reads

### Key Advantages

1. **Direct JSON Storage**
   - Frontend outline structure maps 1:1 to database
   - No translation layer or ORM complexity
   - Export is trivial - it's already JSON

2. **Voice/AI Integration Simplicity**
   ```python
   # Entire document context for AI processing
   doc = cosmos.read_document(doc_id)
   updated = ai.process_voice("Change vector DB bullet to Cosmos", doc)
   cosmos.replace_document(doc_id, updated)
   ```

3. **Performance Characteristics**
   - Point reads: < 10ms latency
   - Writes: < 15ms latency
   - Automatic indexing of all properties
   - No query optimization needed

## API Design (Based on Mock Services)

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token

### Outline Endpoints
- `GET /outlines` - List user's outlines
- `POST /outlines` - Create new outline
- `GET /outlines/{id}` - Get specific outline
- `PUT /outlines/{id}` - Update outline
- `DELETE /outlines/{id}` - Delete outline
- `GET /outlines/{id}/items` - Get outline items
- `POST /outlines/{id}/items` - Add item
- `PUT /outlines/{id}/items/{itemId}` - Update item
- `DELETE /outlines/{id}/items/{itemId}` - Delete item
- `POST /outlines/{id}/items/{itemId}/indent` - Indent item
- `POST /outlines/{id}/items/{itemId}/outdent` - Outdent item

### Voice/AI Endpoints
- `POST /voice/transcribe` - Transcribe audio to text
- `POST /voice/structure` - Structure text into outline
- `PUT /outlines/{id}/voice` - Update outline with voice command

## Development Approach

### Phase 2A: TDD with Mock Contracts (Current)
1. Write comprehensive test suite based on mock service behavior
2. Tests define the exact API contract
3. Ensure all mock responses are captured in tests

### Phase 2B: Minimal Implementation
1. Implement FastAPI backend with in-memory storage
2. Pass all tests from Phase 2A
3. Verify frontend still works perfectly

### Phase 2C: Cosmos DB Integration
1. Add Cosmos DB client
2. Replace in-memory storage with Cosmos
3. All tests should still pass
4. Deploy to Azure

## Future Optimizations (Phase 3)

These are intentionally deferred to avoid premature optimization:

- [ ] **Real-time Sync Strategy**
  - Option 1: Cosmos Change Feed + WebSockets
  - Option 2: Polling with ETags
  - Option 3: SignalR integration

- [ ] **Search Implementation**
  - Option 1: Cosmos DB built-in search
  - Option 2: Azure Cognitive Search integration
  - Option 3: Elasticsearch

- [ ] **Offline Sync & Conflict Resolution**
  - Last-write-wins vs operational transforms
  - Client-side queue for offline changes
  - Sync reconciliation strategy

- [ ] **Advanced Permissions Model**
  - Granular permissions (read/write/admin)
  - Folder-level permissions
  - Public sharing links

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: Azure Cosmos DB (Core SQL API)
- **Authentication**: JWT with refresh tokens
- **Voice/AI**: OpenAI Whisper + Claude/GPT-4
- **Testing**: pytest + pytest-asyncio
- **Validation**: Pydantic v2

### Infrastructure
- **Hosting**: Azure App Service (later)
- **Database**: Azure Cosmos DB Free Tier
- **CDN**: Azure CDN (for static assets)
- **Monitoring**: Azure Application Insights

## Security Considerations

1. **Authentication**
   - JWT tokens with short expiry (15 min access, 7 day refresh)
   - Secure password hashing (bcrypt)
   - Rate limiting on auth endpoints

2. **Data Access**
   - Partition key ensures user data isolation
   - Row-level security through partition keys
   - API validates user owns/has access to documents

3. **API Security**
   - CORS configuration for frontend domain
   - Request validation with Pydantic
   - SQL injection impossible (NoSQL)
   - Input sanitization for XSS prevention

## Performance Targets

Based on PRD requirements:
- Page load: < 2 seconds
- API response time: < 200ms (p95)
- Voice transcription: < 500ms
- Document size: Support up to 10,000 items
- Concurrent users: 1,000+ on free tier

## Migration Path

When scaling beyond free tier:
1. Enable Cosmos DB autoscale
2. Add Azure CDN for global distribution
3. Implement caching layer (Redis)
4. Consider read replicas for different regions

---

*Last Updated: January 2025*
*Architecture Decision: Cosmos DB over PostgreSQL for document-oriented simplicity*