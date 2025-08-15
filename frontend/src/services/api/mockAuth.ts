// Mock Authentication Service
// This will be replaced with real API calls in Phase 3

import type { User } from '@/types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Simulated delay for network requests
const simulateDelay = (ms: number = 800) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock user database
const mockUsers: Map<string, { password: string; user: User }> = new Map();

// Mock token storage
let currentUser: User | null = null;

export const mockAuthService = {
  async register(email: string, password: string, displayName: string): Promise<AuthResponse> {
    await simulateDelay();

    // Check if user already exists
    if (mockUsers.has(email)) {
      throw new Error('User already exists');
    }

    // Create new user
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name: displayName,

      settings: {
        theme: 'light',
        fontSize: 16,
        autoSave: true,
        shortcuts: {},
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store user
    mockUsers.set(email, { password, user });

    // Generate mock tokens
    const response: AuthResponse = {
      user,
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
    };

    // Set current user
    currentUser = user;
    
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', response.accessToken);

    return response;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    await simulateDelay();

    const userData = mockUsers.get(email);
    
    if (!userData || userData.password !== password) {
      throw new Error('Invalid credentials');
    }

    const response: AuthResponse = {
      user: userData.user,
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
    };

    // Set current user
    currentUser = userData.user;
    
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData.user));
    localStorage.setItem('accessToken', response.accessToken);

    return response;
  },

  async logout(): Promise<void> {
    await simulateDelay(300);
    
    currentUser = null;
    
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  },

  async getCurrentUser(): Promise<User | null> {
    // Check localStorage first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
    return currentUser;
  },

  async refreshToken(_refreshToken: string): Promise<AuthResponse> {
    await simulateDelay();
    
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    return {
      user: currentUser,
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
    };
  },

  // Initialize with a test user
  initTestUser() {
    const testUser: User = {
      id: 'user_test',
      email: 'test@brainflowy.com',
      name: 'Test User',

      settings: {
        theme: 'light',
        fontSize: 16,
        autoSave: true,
        shortcuts: {},
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockUsers.set('test@brainflowy.com', {
      password: 'password123',
      user: testUser,
    });
  },
};

// Initialize test user on load
mockAuthService.initTestUser();