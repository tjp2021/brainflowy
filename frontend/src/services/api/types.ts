// API Types and Interfaces

// User related types
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultViewMode: 'mindmap' | 'outline' | 'hybrid';
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Mind map / Outline types
export interface Outline {
  id: string;
  userId: string;
  title: string;
  description?: string;
  rootNode: OutlineNode;
  tags: string[];
  isPublic: boolean;
  isShared: boolean;
  sharedWith?: string[]; // user IDs
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  settings?: OutlineSettings;
}

export interface OutlineNode {
  id: string;
  content: string;
  type: 'text' | 'heading' | 'task' | 'link' | 'image';
  children: OutlineNode[];
  parentId?: string;
  position: NodePosition;
  style?: NodeStyle;
  metadata?: NodeMetadata;
  isExpanded: boolean;
  isCompleted?: boolean; // for task nodes
}

export interface NodePosition {
  x: number;
  y: number;
  order: number; // for outline view ordering
}

export interface NodeStyle {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  icon?: string;
  shape?: 'rectangle' | 'circle' | 'diamond' | 'hexagon';
}

export interface NodeMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  linkedNodes?: string[]; // IDs of connected nodes
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  replies?: Comment[];
}

export interface OutlineSettings {
  defaultNodeStyle: NodeStyle;
  showConnections: boolean;
  layoutType: 'radial' | 'tree' | 'force' | 'manual';
  zoomLevel: number;
  panPosition: { x: number; y: number };
}

// Collaboration types
export interface Collaborator {
  userId: string;
  user: User;
  role: 'viewer' | 'editor' | 'owner';
  joinedAt: Date;
  isActive: boolean;
  cursor?: CursorPosition;
}

export interface CursorPosition {
  nodeId: string;
  x: number;
  y: number;
  color: string;
}

// API Request/Response types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  path?: string;
}

// Search and filter types
export interface SearchParams {
  query: string;
  filters?: SearchFilters;
  pagination?: PaginationParams;
}

export interface SearchFilters {
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  isPublic?: boolean;
  nodeTypes?: string[];
}

// Outline Item types (for the actual implementation)
export interface OutlineItem {
  id: string;
  content: string;
  parentId?: string | null;
  outlineId: string;
  order: number;
  children: OutlineItem[];
  style?: 'header' | 'code' | 'quote' | 'normal';
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    size?: 'large' | 'medium' | 'small';
  };
  createdAt: string;
  updatedAt: string;
}

// Request types for outline operations
export interface CreateOutlineRequest {
  title: string;
  userId: string;
}

export interface UpdateOutlineRequest {
  title?: string;
}

export interface CreateItemRequest {
  content: string;
  parentId?: string | null;
  style?: 'header' | 'code' | 'quote' | 'normal';
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    size?: 'large' | 'medium' | 'small';
  };
}

export interface UpdateItemRequest {
  content?: string;
  parentId?: string | null;
  order?: number;
  style?: 'header' | 'code' | 'quote' | 'normal';
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    size?: 'large' | 'medium' | 'small';
  };
}

// Export types
export interface ExportOptions {
  format: 'json' | 'markdown' | 'pdf' | 'png' | 'svg' | 'freemind';
  includeMetadata?: boolean;
  includeComments?: boolean;
  includeAttachments?: boolean;
}

// Import types
export interface ImportOptions {
  format: 'json' | 'markdown' | 'freemind' | 'opml';
  mergeStrategy?: 'replace' | 'append' | 'merge';
  preserveIds?: boolean;
}

// Real-time update types
export interface RealtimeUpdate {
  type: 'node-update' | 'node-add' | 'node-delete' | 'cursor-move' | 'user-join' | 'user-leave';
  outlineId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

// Statistics types
export interface OutlineStatistics {
  nodeCount: number;
  maxDepth: number;
  wordCount: number;
  taskCount: number;
  completedTaskCount: number;
  collaboratorCount: number;
  attachmentCount: number;
  lastModified: Date;
}

// Template types
export interface OutlineTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: OutlineNode;
  thumbnail?: string;
  usageCount: number;
  rating: number;
  isPremium: boolean;
}