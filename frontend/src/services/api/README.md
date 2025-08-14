# Mock API Service Documentation

## Overview

The Mock API Service provides a complete backend simulation for BrainFlowy's frontend development. It mimics real API behavior including latency, errors, and data persistence.

## Features

### 🔐 Authentication
- User login/logout
- Registration
- Token refresh
- Profile management
- Session persistence

### 📝 Outlines Management
- CRUD operations (Create, Read, Update, Delete)
- Pagination support
- Search and filtering
- Sorting capabilities
- Duplication
- Statistics

### 🌳 Node Operations
- Add/remove nodes
- Update node content and properties
- Move nodes between parents
- Task completion tracking
- Metadata management

### 📋 Templates
- Pre-built outline templates
- Template categories
- Create outlines from templates
- Usage tracking

### 💾 Import/Export
- JSON format
- Markdown format
- Multiple export options
- Import with merge strategies

### 👥 Collaboration
- Share outlines with users
- Manage collaborators
- Role-based permissions
- Real-time cursor tracking

### 💬 Comments & Attachments
- Add comments to nodes
- Reply threads
- File attachments
- Attachment management

### 🔄 Real-time Updates
- WebSocket simulation
- Cursor position updates
- User presence
- Live collaboration events

## Configuration

```typescript
import { api } from '@/services/api';

// Configure mock behavior
api.config.minLatency = 100;        // Minimum delay (ms)
api.config.maxLatency = 500;        // Maximum delay (ms)
api.config.errorRate = 0.05;        // 5% error rate
api.config.networkFailureRate = 0.02; // 2% network failures
api.config.enableLatency = true;    // Toggle latency simulation
api.config.enableErrors = true;     // Toggle error simulation
api.config.enablePersistence = true; // Toggle localStorage
```

## Usage Examples

### Authentication

```typescript
import { api } from '@/services/api';

// Login
const authResponse = await api.auth.login({
  email: 'demo@brainflowy.com',
  password: 'password123'
});
console.log(authResponse.user, authResponse.accessToken);

// Register new user
const newUser = await api.auth.register({
  email: 'new@example.com',
  username: 'newuser',
  password: 'secure123',
  fullName: 'New User'
});

// Get current user
const profile = await api.auth.getCurrentUserProfile();

// Update profile
const updated = await api.auth.updateProfile({
  fullName: 'Updated Name',
  preferences: { theme: 'dark' }
});

// Logout
await api.auth.logout();
```

### Outlines Management

```typescript
// Get user's outlines with pagination
const response = await api.outlines.getOutlines({
  page: 1,
  limit: 10,
  sortBy: 'updatedAt',
  sortOrder: 'desc'
});

// Create new outline
const outline = await api.outlines.createOutline({
  title: 'Project Planning',
  description: 'Q4 2024 roadmap',
  tags: ['work', 'planning'],
  isPublic: false
});

// Update outline
const updated = await api.outlines.updateOutline(outline.id, {
  title: 'Updated Title',
  tags: ['work', 'planning', 'q4']
});

// Search outlines
const searchResults = await api.outlines.searchOutlines({
  query: 'project',
  filters: {
    tags: ['work'],
    isPublic: false
  },
  pagination: { page: 1, limit: 20 }
});

// Get statistics
const stats = await api.outlines.getStatistics(outline.id);
console.log(`Nodes: ${stats.nodeCount}, Tasks: ${stats.taskCount}`);

// Delete outline
await api.outlines.deleteOutline(outline.id);
```

### Node Operations

```typescript
// Add a new node
const newNode = await api.nodes.addNode(
  outlineId,
  parentNodeId,
  {
    content: 'New task item',
    type: 'task',
    style: { color: '#0066cc' }
  }
);

// Update node
const updated = await api.nodes.updateNode(
  outlineId,
  nodeId,
  {
    content: 'Updated content',
    isCompleted: true
  }
);

// Move node to different parent
await api.nodes.moveNode(
  outlineId,
  nodeId,
  newParentId,
  0 // position index
);

// Delete node
await api.nodes.deleteNode(outlineId, nodeId);
```

### Templates

```typescript
// Get all templates
const templates = await api.templates.getTemplates();

// Get templates by category
const businessTemplates = await api.templates.getTemplates('Business');

// Create outline from template
const fromTemplate = await api.templates.createFromTemplate(
  'template-1',
  'My SWOT Analysis'
);
```

### Export/Import

```typescript
// Export outline
const blob = await api.exportImport.exportOutline(outlineId, {
  format: 'markdown',
  includeMetadata: true,
  includeComments: true
});

// Save to file
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'outline.md';
a.click();

// Import outline
const file = inputElement.files[0];
const imported = await api.exportImport.importOutline(file, {
  format: 'markdown',
  mergeStrategy: 'append'
});
```

### Collaboration

```typescript
// Get collaborators
const collaborators = await api.collaboration.getCollaborators(outlineId);

// Invite collaborator
await api.collaboration.inviteCollaborator(
  outlineId,
  'alice@example.com',
  'editor'
);

// Remove collaborator
await api.collaboration.removeCollaborator(outlineId, userId);
```

### Real-time Updates

```typescript
import { api } from '@/services/api';

// Connect to outline
api.websocket.connect(outlineId);

// Listen for cursor movements
api.websocket.on('cursor-move', (update) => {
  console.log(`User ${update.userId} moved cursor to`, update.data);
});

// Listen for node updates
api.websocket.on('node-update', (update) => {
  console.log('Node updated:', update.data);
});

// Disconnect when done
api.websocket.disconnect();
```

## Mock Data

### Default Users

| Email | Password | Description |
|-------|----------|-------------|
| demo@brainflowy.com | any | Demo user account |
| alice@example.com | any | Sample user 1 |
| bob@example.com | any | Sample user 2 |

*Note: Any password of 6+ characters works in mock mode*

### Pre-populated Data

The mock API comes with:
- 8 sample outlines with varying complexity
- 5 outline templates
- Sample users with different preferences
- Generated comments and attachments

## Error Handling

The mock API simulates common error scenarios:

```typescript
try {
  await api.auth.login({ email, password });
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    console.error('Invalid login credentials');
  } else if (error.code === 'NETWORK_ERROR') {
    console.error('Network connection failed');
  } else if (error.code === 'RATE_LIMIT') {
    console.error('Too many requests, retry after:', error.details.retryAfter);
  }
}
```

### Common Error Codes

- `INVALID_CREDENTIALS` - Authentication failed
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT` - Rate limit exceeded
- `NETWORK_ERROR` - Network failure
- `INVALID_OPERATION` - Operation not allowed
- `EMAIL_EXISTS` - Email already registered

## Testing

### Disable Delays for Tests

```typescript
import { api } from '@/services/api';

// In test setup
beforeAll(() => {
  api.config.enableLatency = false;
  api.config.enableErrors = false;
});
```

### Reset Mock Data

```typescript
// Clear all stored data
localStorage.clear();
sessionStorage.clear();

// Reload mock data
window.location.reload();
```

## Migration to Real API

When ready to connect to a real backend:

1. Keep the same type definitions (`types.ts`)
2. Replace mock implementations with real API calls
3. Update the API configuration
4. Remove mock data generators

The interface remains the same, ensuring smooth migration:

```typescript
// Before (mock)
import { api } from '@/services/api/mockApi';

// After (real)
import { api } from '@/services/api/realApi';

// Usage remains identical
const outlines = await api.outlines.getOutlines();
```

## Performance Considerations

- Mock data is generated on-demand and cached
- localStorage has a 5-10MB limit
- Large outlines may impact performance
- WebSocket simulation runs on intervals

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires localStorage and sessionStorage
- ES2020+ JavaScript features

## Development Tips

1. **Persistent Data**: Data persists across page reloads via localStorage
2. **Session Auth**: Authentication persists only for the session
3. **Error Testing**: Temporarily increase error rate to test error handling
4. **Performance**: Disable latency during development for faster iteration
5. **Real-time**: WebSocket simulation helps test collaborative features

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not persisting | Check localStorage is enabled |
| Auth not working | Clear sessionStorage and retry |
| High error rate | Reduce `api.config.errorRate` |
| Slow responses | Reduce latency settings |
| WebSocket not updating | Check `enableRealtimeSimulation` |

## Future Enhancements

- [ ] GraphQL mock endpoint
- [ ] File upload simulation
- [ ] Offline mode support
- [ ] Mock data generator UI
- [ ] Performance profiling
- [ ] E2E test helpers