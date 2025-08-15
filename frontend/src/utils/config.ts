import type { Config } from '@/types';

// Environment configuration utility
export const config: Config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
  appName: import.meta.env.VITE_APP_NAME || 'BrainFlowy',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  enableMockApi: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
  enablePwa: import.meta.env.VITE_ENABLE_PWA === 'true',
  enableVoiceFeatures: import.meta.env.VITE_ENABLE_VOICE_FEATURES === 'true',
};

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// API endpoint builders
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
  const version = config.apiVersion;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}/api/${version}${cleanEndpoint}`;
};

// Validation helpers
export const validateConfig = (): void => {
  const required = ['apiBaseUrl', 'appName'];
  const missing = required.filter(key => !config[key as keyof Config]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Initialize config validation on import
if (isProduction) {
  validateConfig();
}