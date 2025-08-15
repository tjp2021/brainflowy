// Core application types for BrainFlowy

export interface Node {
  id: string;
  content: string;
  parentId: string | null;
  children: Node[];
  createdAt: Date;
  updatedAt: Date;
  isExpanded: boolean;
  metadata?: NodeMetadata;
}

export interface NodeMetadata {
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'archived';
  color?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  autoSave: boolean;
  shortcuts: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Navigation types
export interface Route {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
}

// Environment types
export interface Config {
  apiBaseUrl: string;
  apiVersion: string;
  appName: string;
  appVersion: string;
  enableMockApi: boolean;
  enablePwa: boolean;
  enableVoiceFeatures: boolean;
}

// Store types (for Zustand)
export interface AppState {
  user: User | null;
  nodes: Node[];
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppActions {
  setUser: (user: User | null) => void;
  setNodes: (nodes: Node[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export type AppStore = AppState & AppActions;