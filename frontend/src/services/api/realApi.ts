/**
 * Real API Service Layer for BrainFlowy
 * Connects to the actual backend API instead of using mocks
 */

import { getApiUrl } from '@/utils/config';
import type { 
  AuthResponse, 
  User,
  Outline,
  OutlineItem,
  CreateOutlineRequest,
  UpdateOutlineRequest,
  CreateItemRequest,
  UpdateItemRequest
} from './types';

// Helper for auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Helper for handling responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

// Authentication Service
export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(getApiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await handleResponse<AuthResponse>(response);
    
    // Store tokens
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  async register(email: string, password: string, displayName: string): Promise<AuthResponse> {
    const response = await fetch(getApiUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });
    
    const data = await handleResponse<AuthResponse>(response);
    
    // Store tokens
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(getApiUrl('/auth/logout'), {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } finally {
      // Clear local storage regardless of server response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
      const response = await fetch(getApiUrl('/auth/me'), {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        // Token might be expired
        localStorage.clear();
        sessionStorage.clear();
        return null;
      }
      
      return await response.json();
    } catch {
      return null;
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await fetch(getApiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await handleResponse<AuthResponse>(response);
    
    // Update tokens
    if (data.accessToken) {
      sessionStorage.setItem('accessToken', data.accessToken);
      sessionStorage.setItem('refreshToken', data.refreshToken);
    }
    
    return data;
  }
};

// Outline Service
export const outlineService = {
  async getOutlines(userId?: string): Promise<Outline[]> {
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(getApiUrl(`/outlines${params}`), {
      headers: getAuthHeaders()
    });
    
    return handleResponse<Outline[]>(response);
  },

  async getOutline(id: string): Promise<Outline> {
    const response = await fetch(getApiUrl(`/outlines/${id}`), {
      headers: getAuthHeaders()
    });
    
    return handleResponse<Outline>(response);
  },

  async createOutline(data: CreateOutlineRequest): Promise<Outline> {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const response = await fetch(getApiUrl('/outlines'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        userId: user.id
      })
    });
    
    return handleResponse<Outline>(response);
  },

  async updateOutline(id: string, data: UpdateOutlineRequest): Promise<Outline> {
    const response = await fetch(getApiUrl(`/outlines/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return handleResponse<Outline>(response);
  },

  async deleteOutline(id: string): Promise<void> {
    const response = await fetch(getApiUrl(`/outlines/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete outline: ${response.status}`);
    }
  },

  // Outline Items
  async getOutlineItems(outlineId: string): Promise<OutlineItem[]> {
    const response = await fetch(getApiUrl(`/outlines/${outlineId}/items`), {
      headers: getAuthHeaders()
    });
    
    return handleResponse<OutlineItem[]>(response);
  },

  async createItem(outlineId: string, data: CreateItemRequest): Promise<OutlineItem> {
    const response = await fetch(getApiUrl(`/outlines/${outlineId}/items`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return handleResponse<OutlineItem>(response);
  },

  async updateItem(outlineId: string, itemId: string, data: UpdateItemRequest): Promise<OutlineItem> {
    const response = await fetch(getApiUrl(`/outlines/${outlineId}/items/${itemId}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return handleResponse<OutlineItem>(response);
  },

  async deleteItem(outlineId: string, itemId: string): Promise<void> {
    const response = await fetch(getApiUrl(`/outlines/${outlineId}/items/${itemId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete item: ${response.status}`);
    }
  }
};

// Voice Service
export const voiceService = {
  async transcribeAudio(audioBlob: Blob): Promise<{ text: string; confidence: number; duration: number }> {
    console.log('🎤 Real API: Transcribing audio blob, size:', audioBlob.size);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const url = getApiUrl('/voice/transcribe');
    console.log('🎤 Real API: Calling backend at:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    
    const data = await handleResponse<any>(response);
    return {
      text: data.text,
      confidence: data.confidence,
      duration: data.duration
    };
  },

  async structureText(text: string): Promise<any> {
    const response = await fetch(getApiUrl('/voice/structure'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    
    return handleResponse<any>(response);
  },

  async improveOutline(items: Array<{ content: string; level: number }>): Promise<any> {
    const text = items.map(i => i.content).join('. ');
    const response = await fetch(getApiUrl('/voice/improve'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    
    return handleResponse<any>(response);
  },

  // Reuse mock recording functions since they handle browser MediaRecorder
  async startRecording(): Promise<MediaRecorder | null> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Media recording not supported');
        return null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      return mediaRecorder;
    } catch (error) {
      console.log('Microphone access denied');
      return null;
    }
  },

  async stopRecording(mediaRecorder: MediaRecorder | null): Promise<Blob> {
    if (!mediaRecorder) {
      return new Blob([''], { type: 'audio/webm' });
    }
    
    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.stop();
    });
  }
};

// Export a unified API object
export const realApi = {
  auth: authService,
  outlines: outlineService,
  voice: voiceService
};