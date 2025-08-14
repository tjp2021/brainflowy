/**
 * Mock API Service Layer for BrainFlowy
 * 
 * This module provides a comprehensive mock API that simulates all backend
 * functionality needed for UI development. It includes:
 * 
 * - Authentication (login, register, logout, token refresh)
 * - User profile management
 * - Full CRUD operations for outlines/mind maps
 * - Node operations (add, update, delete, move)
 * - Templates system
 * - Export/Import functionality
 * - Collaboration features
 * - Comments and attachments
 * - Real-time updates simulation via WebSocket
 * - Configurable latency and error simulation
 * - Local storage persistence
 * 
 * Configuration:
 * - Latency: 200-800ms by default (configurable)
 * - Error rate: 5% random errors, 2% network failures (configurable)
 * - Persistence: Uses localStorage for data, sessionStorage for auth
 * 
 * Usage:
 * ```typescript
 * import { api } from '@/services/api';
 * 
 * // Authentication
 * const response = await api.auth.login({ email, password });
 * 
 * // Get outlines
 * const outlines = await api.outlines.getOutlines({ page: 1, limit: 10 });
 * 
 * // Create outline
 * const newOutline = await api.outlines.createOutline({ title: 'My Mind Map' });
 * 
 * // Configure mock behavior
 * api.config.enableLatency = false; // Disable latency for testing
 * api.config.errorRate = 0; // Disable errors
 * ```
 */

export * from './types';
export * from './mockData';
export { mockApi as api, mockConfig, websocket } from './mockApi';

// Re-export commonly used items for convenience
export { 
  authApi,
  outlinesApi,
  nodesApi,
  templatesApi,
  exportImportApi,
  collaborationApi,
  commentsApi,
  attachmentsApi
} from './mockApi';

// Default export for easy importing
import { mockApi } from './mockApi';
export default mockApi;