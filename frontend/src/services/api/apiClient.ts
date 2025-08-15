/**
 * API Client that switches between mock and real implementation
 * based on environment configuration
 */

import { config } from '@/utils/config';
import { mockAuthService } from './mockAuth';
import { mockOutlinesService } from './mockOutlines';
import { mockVoiceService } from './mockVoice';
import { realApi } from './realApi';

// Determine which API to use
const useMockApi = config.enableMockApi;

console.log(`🔌 API Mode: ${useMockApi ? 'MOCK' : 'REAL'} (Backend: ${config.apiBaseUrl})`);
console.log(`🔌 Config.enableMockApi: ${config.enableMockApi}`);
console.log(`🔌 VITE_ENABLE_MOCK_API env: ${import.meta.env.VITE_ENABLE_MOCK_API}`);

// Export the appropriate API based on configuration
export const apiClient = useMockApi ? {
  auth: mockAuthService,
  outlines: mockOutlinesService,
  voice: mockVoiceService
} : realApi;

// Export individual services for convenience
export const authApi = apiClient.auth;
export const outlinesApi = apiClient.outlines;
export const voiceApi = apiClient.voice;