import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Outline,
  OutlineNode,
  PaginatedResponse,
  PaginationParams,
  SearchParams,
  ApiError,
  OutlineTemplate,
  ExportOptions,
  ImportOptions,
  RealtimeUpdate,
  OutlineStatistics,
  Collaborator,
  Attachment
} from './types';

import {
  mockUsers,
  mockTemplates,
  generateId,
  generateMockNode,
  getCurrentUser,
  setCurrentUser,
  getStoredOutlines,
  saveOutlines
} from './mockData';

// Configuration for mock behavior
export const mockConfig = {
  // Latency simulation (milliseconds)
  minLatency: 200,
  maxLatency: 800,
  
  // Error simulation
  errorRate: 0.05, // 5% chance of error
  networkFailureRate: 0.02, // 2% chance of network failure
  
  // Feature flags
  enableLatency: true,
  enableErrors: true,
  enablePersistence: true,
  enableRealtimeSimulation: true
};

// Helper to simulate network latency
const simulateLatency = async (): Promise<void> => {
  if (!mockConfig.enableLatency) return;
  
  const latency = Math.random() * (mockConfig.maxLatency - mockConfig.minLatency) + mockConfig.minLatency;
  await new Promise(resolve => setTimeout(resolve, latency));
};

// Helper to simulate errors
const maybeThrowError = (): void => {
  if (!mockConfig.enableErrors) return;
  
  if (Math.random() < mockConfig.networkFailureRate) {
    throw new Error('Network request failed');
  }
  
  if (Math.random() < mockConfig.errorRate) {
    const errors: ApiError[] = [
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        timestamp: new Date(),
        details: { field: 'unknown', reason: 'Invalid format' }
      },
      {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        timestamp: new Date()
      },
      {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date()
      },
      {
        code: 'RATE_LIMIT',
        message: 'Too many requests',
        timestamp: new Date(),
        details: { retryAfter: 60 }
      }
    ];
    
    throw errors[Math.floor(Math.random() * errors.length)];
  }
};

// Authentication API
export const authApi = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    await simulateLatency();
    maybeThrowError();
    
    // Find user by email
    const user = mockUsers.find(u => u.email === request.email);
    
    if (!user) {
      throw {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        timestamp: new Date()
      } as ApiError;
    }
    
    // Mock password validation (any password works in mock)
    if (request.password.length < 6) {
      throw {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        timestamp: new Date()
      } as ApiError;
    }
    
    // Generate tokens
    const accessToken = `mock-access-token-${generateId()}`;
    const refreshToken = `mock-refresh-token-${generateId()}`;
    
    // Store current user
    setCurrentUser(user);
    
    return {
      user,
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour
    };
  },
  
  async register(request: RegisterRequest): Promise<AuthResponse> {
    await simulateLatency();
    maybeThrowError();
    
    // Check if email already exists
    if (mockUsers.find(u => u.email === request.email)) {
      throw {
        code: 'EMAIL_EXISTS',
        message: 'Email already registered',
        timestamp: new Date()
      } as ApiError;
    }
    
    // Create new user
    const newUser: User = {
      id: `user-${generateId()}`,
      email: request.email,
      username: request.username,
      fullName: request.fullName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.username}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        theme: 'light',
        language: 'en',
        defaultViewMode: 'hybrid',
        autoSave: true,
        autoSaveInterval: 30
      }
    };
    
    // Add to mock users
    mockUsers.push(newUser);
    
    // Generate tokens
    const accessToken = `mock-access-token-${generateId()}`;
    const refreshToken = `mock-refresh-token-${generateId()}`;
    
    // Store current user
    setCurrentUser(newUser);
    
    return {
      user: newUser,
      accessToken,
      refreshToken,
      expiresIn: 3600
    };
  },
  
  async logout(): Promise<void> {
    await simulateLatency();
    setCurrentUser(null);
  },
  
  async refreshToken(_refreshToken: string): Promise<AuthResponse> {
    await simulateLatency();
    maybeThrowError();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw {
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token',
        timestamp: new Date()
      } as ApiError;
    }
    
    return {
      user: currentUser,
      accessToken: `mock-access-token-${generateId()}`,
      refreshToken: `mock-refresh-token-${generateId()}`,
      expiresIn: 3600
    };
  },
  
  async getCurrentUserProfile(): Promise<User> {
    await simulateLatency();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
        timestamp: new Date()
      } as ApiError;
    }
    
    return currentUser;
  },
  
  async updateProfile(updates: Partial<User>): Promise<User> {
    await simulateLatency();
    maybeThrowError();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
        timestamp: new Date()
      } as ApiError;
    }
    
    const updatedUser = {
      ...currentUser,
      ...updates,
      id: currentUser.id, // Prevent ID change
      updatedAt: new Date()
    };
    
    setCurrentUser(updatedUser);
    
    // Update in mock users array
    const index = mockUsers.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      mockUsers[index] = updatedUser;
    }
    
    return updatedUser;
  }
};

// Outlines CRUD API
export const outlinesApi = {
  async getOutlines(params?: PaginationParams): Promise<PaginatedResponse<Outline>> {
    await simulateLatency();
    maybeThrowError();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
        timestamp: new Date()
      } as ApiError;
    }
    
    let outlines = getStoredOutlines();
    
    // Filter by current user
    outlines = outlines.filter(o => 
      o.userId === currentUser.id || 
      o.isPublic || 
      (o.sharedWith && o.sharedWith.includes(currentUser.id))
    );
    
    // Apply sorting
    if (params?.sortBy) {
      outlines.sort((a, b) => {
        const aVal = (a as any)[params.sortBy!];
        const bVal = (b as any)[params.sortBy!];
        const order = params.sortOrder === 'desc' ? -1 : 1;
        
        if (aVal < bVal) return -order;
        if (aVal > bVal) return order;
        return 0;
      });
    }
    
    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    const paginatedOutlines = outlines.slice(start, end);
    
    return {
      data: paginatedOutlines,
      total: outlines.length,
      page,
      limit,
      totalPages: Math.ceil(outlines.length / limit),
      hasMore: end < outlines.length
    };
  },
  
  async getOutline(id: string): Promise<Outline> {
    await simulateLatency();
    maybeThrowError();
    
    const outlines = getStoredOutlines();
    const outline = outlines.find(o => o.id === id);
    
    if (!outline) {
      throw {
        code: 'NOT_FOUND',
        message: 'Outline not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    // Update last accessed
    outline.lastAccessedAt = new Date();
    saveOutlines(outlines);
    
    return outline;
  },
  
  async createOutline(data: Partial<Outline>): Promise<Outline> {
    await simulateLatency();
    maybeThrowError();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
        timestamp: new Date()
      } as ApiError;
    }
    
    const newOutline: Outline = {
      id: `outline-${generateId()}`,
      userId: currentUser.id,
      title: data.title || 'Untitled',
      description: data.description || '',
      rootNode: data.rootNode || generateMockNode(data.title || 'Root', 0, 1),
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      isShared: data.isShared || false,
      sharedWith: data.sharedWith || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
      settings: data.settings || {
        defaultNodeStyle: {
          color: '#333333',
          fontSize: 14,
          fontWeight: 'normal',
          shape: 'rectangle'
        },
        showConnections: true,
        layoutType: 'tree',
        zoomLevel: 1,
        panPosition: { x: 0, y: 0 }
      }
    };
    
    const outlines = getStoredOutlines();
    outlines.push(newOutline);
    saveOutlines(outlines);
    
    return newOutline;
  },
  
  async updateOutline(id: string, updates: Partial<Outline>): Promise<Outline> {
    await simulateLatency();
    maybeThrowError();
    
    const outlines = getStoredOutlines();
    const index = outlines.findIndex(o => o.id === id);
    
    if (index === -1) {
      throw {
        code: 'NOT_FOUND',
        message: 'Outline not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    const updatedOutline = {
      ...outlines[index],
      ...updates,
      id: outlines[index].id, // Prevent ID change
      userId: outlines[index].userId, // Prevent owner change
      updatedAt: new Date()
    };
    
    outlines[index] = updatedOutline;
    saveOutlines(outlines);
    
    return updatedOutline;
  },
  
  async deleteOutline(id: string): Promise<void> {
    await simulateLatency();
    maybeThrowError();
    
    const outlines = getStoredOutlines();
    const index = outlines.findIndex(o => o.id === id);
    
    if (index === -1) {
      throw {
        code: 'NOT_FOUND',
        message: 'Outline not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    outlines.splice(index, 1);
    saveOutlines(outlines);
  },
  
  async duplicateOutline(id: string): Promise<Outline> {
    await simulateLatency();
    maybeThrowError();
    
    const outline = await this.getOutline(id);
    
    const { id: _, createdAt, updatedAt, lastAccessedAt, ...outlineData } = outline;
    
    const duplicated = await this.createOutline({
      ...outlineData,
      title: `${outline.title} (Copy)`
    });
    
    return duplicated;
  },
  
  async searchOutlines(params: SearchParams): Promise<PaginatedResponse<Outline>> {
    await simulateLatency();
    maybeThrowError();
    
    let outlines = getStoredOutlines();
    
    // Apply search query
    if (params.query) {
      const query = params.query.toLowerCase();
      outlines = outlines.filter(o => 
        o.title.toLowerCase().includes(query) ||
        o.description?.toLowerCase().includes(query) ||
        o.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // Apply filters
    if (params.filters) {
      if (params.filters.tags && params.filters.tags.length > 0) {
        outlines = outlines.filter(o =>
          params.filters!.tags!.some(tag => o.tags.includes(tag))
        );
      }
      
      if (params.filters.dateRange) {
        outlines = outlines.filter(o =>
          o.createdAt >= params.filters!.dateRange!.start &&
          o.createdAt <= params.filters!.dateRange!.end
        );
      }
      
      if (params.filters.isPublic !== undefined) {
        outlines = outlines.filter(o => o.isPublic === params.filters!.isPublic);
      }
    }
    
    // Apply pagination
    const page = params.pagination?.page || 1;
    const limit = params.pagination?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: outlines.slice(start, end),
      total: outlines.length,
      page,
      limit,
      totalPages: Math.ceil(outlines.length / limit),
      hasMore: end < outlines.length
    };
  },
  
  async getStatistics(id: string): Promise<OutlineStatistics> {
    await simulateLatency();
    
    const outline = await this.getOutline(id);
    
    // Calculate statistics
    const countNodes = (node: OutlineNode): number => {
      return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
    };
    
    const getMaxDepth = (node: OutlineNode, depth: number = 0): number => {
      if (node.children.length === 0) return depth;
      return Math.max(...node.children.map(child => getMaxDepth(child, depth + 1)));
    };
    
    const countTasks = (node: OutlineNode): { total: number; completed: number } => {
      let total = node.type === 'task' ? 1 : 0;
      let completed = node.type === 'task' && node.isCompleted ? 1 : 0;
      
      node.children.forEach(child => {
        const childCounts = countTasks(child);
        total += childCounts.total;
        completed += childCounts.completed;
      });
      
      return { total, completed };
    };
    
    const taskCounts = countTasks(outline.rootNode);
    
    return {
      nodeCount: countNodes(outline.rootNode),
      maxDepth: getMaxDepth(outline.rootNode),
      wordCount: Math.floor(Math.random() * 5000) + 500, // Mock word count
      taskCount: taskCounts.total,
      completedTaskCount: taskCounts.completed,
      collaboratorCount: (outline.sharedWith?.length || 0) + 1,
      attachmentCount: Math.floor(Math.random() * 10),
      lastModified: outline.updatedAt
    };
  }
};

// Node operations API
export const nodesApi = {
  async addNode(outlineId: string, parentId: string, node: Partial<OutlineNode>): Promise<OutlineNode> {
    await simulateLatency();
    maybeThrowError();
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    const newNode: OutlineNode = {
      id: generateId(),
      content: node.content || 'New Node',
      type: node.type || 'text',
      children: [],
      parentId,
      position: node.position || { x: 0, y: 0, order: 0 },
      ...(node.style && { style: node.style }),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: getCurrentUser()?.id || 'unknown',
        attachments: [],
        comments: [],
        linkedNodes: []
      },
      isExpanded: true,
      ...(node.isCompleted !== undefined && { isCompleted: node.isCompleted })
    };
    
    // Find parent and add child
    const findAndAddNode = (current: OutlineNode): boolean => {
      if (current.id === parentId) {
        current.children.push(newNode);
        return true;
      }
      
      for (const child of current.children) {
        if (findAndAddNode(child)) return true;
      }
      
      return false;
    };
    
    if (!findAndAddNode(outline.rootNode)) {
      throw {
        code: 'NOT_FOUND',
        message: 'Parent node not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    await outlinesApi.updateOutline(outlineId, { rootNode: outline.rootNode });
    
    return newNode;
  },
  
  async updateNode(outlineId: string, nodeId: string, updates: Partial<OutlineNode>): Promise<OutlineNode> {
    await simulateLatency();
    maybeThrowError();
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    const findAndUpdateNode = (current: OutlineNode): OutlineNode | null => {
      if (current.id === nodeId) {
        Object.assign(current, updates, {
          id: current.id, // Prevent ID change
          metadata: {
            ...current.metadata,
            updatedAt: new Date(),
            lastEditedBy: getCurrentUser()?.id
          }
        });
        return current;
      }
      
      for (const child of current.children) {
        const updated = findAndUpdateNode(child);
        if (updated) return updated;
      }
      
      return null;
    };
    
    const updatedNode = findAndUpdateNode(outline.rootNode);
    
    if (!updatedNode) {
      throw {
        code: 'NOT_FOUND',
        message: 'Node not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    await outlinesApi.updateOutline(outlineId, { rootNode: outline.rootNode });
    
    return updatedNode;
  },
  
  async deleteNode(outlineId: string, nodeId: string): Promise<void> {
    await simulateLatency();
    maybeThrowError();
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    if (outline.rootNode.id === nodeId) {
      throw {
        code: 'INVALID_OPERATION',
        message: 'Cannot delete root node',
        timestamp: new Date()
      } as ApiError;
    }
    
    const findAndDeleteNode = (current: OutlineNode): boolean => {
      const index = current.children.findIndex(child => child.id === nodeId);
      
      if (index !== -1) {
        current.children.splice(index, 1);
        return true;
      }
      
      for (const child of current.children) {
        if (findAndDeleteNode(child)) return true;
      }
      
      return false;
    };
    
    if (!findAndDeleteNode(outline.rootNode)) {
      throw {
        code: 'NOT_FOUND',
        message: 'Node not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    await outlinesApi.updateOutline(outlineId, { rootNode: outline.rootNode });
  },
  
  async moveNode(outlineId: string, nodeId: string, newParentId: string, position?: number): Promise<void> {
    await simulateLatency();
    maybeThrowError();
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    // Find and remove node from current position
    let nodeToMove: OutlineNode | null = null;
    
    const findAndRemoveNode = (current: OutlineNode): boolean => {
      const index = current.children.findIndex(child => child.id === nodeId);
      
      if (index !== -1) {
        nodeToMove = current.children.splice(index, 1)[0];
        return true;
      }
      
      for (const child of current.children) {
        if (findAndRemoveNode(child)) return true;
      }
      
      return false;
    };
    
    if (!findAndRemoveNode(outline.rootNode)) {
      throw {
        code: 'NOT_FOUND',
        message: 'Node not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    // Add node to new position
    const findAndAddNode = (current: OutlineNode): boolean => {
      if (current.id === newParentId) {
        if (position !== undefined && position >= 0 && position <= current.children.length) {
          current.children.splice(position, 0, nodeToMove!);
        } else {
          current.children.push(nodeToMove!);
        }
        nodeToMove!.parentId = newParentId;
        return true;
      }
      
      for (const child of current.children) {
        if (findAndAddNode(child)) return true;
      }
      
      return false;
    };
    
    if (!findAndAddNode(outline.rootNode)) {
      throw {
        code: 'NOT_FOUND',
        message: 'New parent node not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    await outlinesApi.updateOutline(outlineId, { rootNode: outline.rootNode });
  }
};

// Templates API
export const templatesApi = {
  async getTemplates(category?: string): Promise<OutlineTemplate[]> {
    await simulateLatency();
    
    if (category) {
      return mockTemplates.filter(t => t.category === category);
    }
    
    return mockTemplates;
  },
  
  async getTemplate(id: string): Promise<OutlineTemplate> {
    await simulateLatency();
    
    const template = mockTemplates.find(t => t.id === id);
    
    if (!template) {
      throw {
        code: 'NOT_FOUND',
        message: 'Template not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    return template;
  },
  
  async createFromTemplate(templateId: string, title?: string): Promise<Outline> {
    await simulateLatency();
    maybeThrowError();
    
    const template = await this.getTemplate(templateId);
    
    const outline = await outlinesApi.createOutline({
      title: title || template.name,
      description: `Created from template: ${template.name}`,
      rootNode: JSON.parse(JSON.stringify(template.structure)), // Deep clone
      tags: ['from-template', template.category.toLowerCase()]
    });
    
    // Increment usage count
    template.usageCount++;
    
    return outline;
  }
};

// Export/Import API
export const exportImportApi = {
  async exportOutline(outlineId: string, options: ExportOptions): Promise<Blob> {
    await simulateLatency();
    maybeThrowError();
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    let content: string;
    let mimeType: string;
    
    switch (options.format) {
      case 'json':
        content = JSON.stringify(outline, null, 2);
        mimeType = 'application/json';
        break;
        
      case 'markdown':
        content = convertToMarkdown(outline.rootNode);
        mimeType = 'text/markdown';
        break;
        
      default:
        // For other formats, return a mock file
        content = `Mock export in ${options.format} format`;
        mimeType = 'application/octet-stream';
    }
    
    return new Blob([content], { type: mimeType });
  },
  
  async importOutline(file: File, options: ImportOptions): Promise<Outline> {
    await simulateLatency();
    maybeThrowError();
    
    const content = await file.text();
    
    let importedData: Partial<Outline>;
    
    try {
      if (options.format === 'json') {
        importedData = JSON.parse(content);
      } else if (options.format === 'markdown') {
        // Mock markdown parsing
        importedData = {
          title: 'Imported from Markdown',
          rootNode: generateMockNode('Imported Content', 0, 2)
        };
      } else {
        importedData = {
          title: `Imported from ${file.name}`,
          rootNode: generateMockNode('Imported Content', 0, 2)
        };
      }
    } catch (error) {
      throw {
        code: 'INVALID_FORMAT',
        message: 'Failed to parse import file',
        timestamp: new Date(),
        details: error
      } as ApiError;
    }
    
    return await outlinesApi.createOutline(importedData);
  }
};

// Helper function to convert to markdown
function convertToMarkdown(node: OutlineNode, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  const bullet = depth === 0 ? '#' : '-';
  
  let markdown = `${indent}${bullet} ${node.content}\n`;
  
  for (const child of node.children) {
    markdown += convertToMarkdown(child, depth + 1);
  }
  
  return markdown;
}

// Collaboration API
export const collaborationApi = {
  async getCollaborators(outlineId: string): Promise<Collaborator[]> {
    await simulateLatency();
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    const collaborators: Collaborator[] = [
      {
        userId: outline.userId,
        user: mockUsers.find(u => u.id === outline.userId)!,
        role: 'owner',
        joinedAt: outline.createdAt,
        isActive: true,
        cursor: {
          nodeId: outline.rootNode.id,
          x: 100,
          y: 100,
          color: '#ff0000'
        }
      }
    ];
    
    if (outline.sharedWith) {
      outline.sharedWith.forEach(userId => {
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
          collaborators.push({
            userId,
            user,
            role: 'editor',
            joinedAt: new Date(),
            isActive: Math.random() > 0.5,
            cursor: {
              nodeId: outline.rootNode.id,
              x: Math.random() * 500,
              y: Math.random() * 500,
              color: `#${Math.floor(Math.random()*16777215).toString(16)}`
            }
          });
        }
      });
    }
    
    return collaborators;
  },
  
  async inviteCollaborator(outlineId: string, email: string, _role: 'viewer' | 'editor'): Promise<void> {
    await simulateLatency();
    maybeThrowError();
    
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      throw {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    if (!outline.sharedWith) {
      outline.sharedWith = [];
    }
    
    if (!outline.sharedWith.includes(user.id)) {
      outline.sharedWith.push(user.id);
      outline.isShared = true;
      await outlinesApi.updateOutline(outlineId, outline);
    }
  },
  
  async removeCollaborator(outlineId: string, userId: string): Promise<void> {
    await simulateLatency();
    maybeThrowError();
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    if (outline.sharedWith) {
      const index = outline.sharedWith.indexOf(userId);
      if (index !== -1) {
        outline.sharedWith.splice(index, 1);
        outline.isShared = outline.sharedWith.length > 0;
        await outlinesApi.updateOutline(outlineId, outline);
      }
    }
  }
};

// Comments API
export const commentsApi = {
  async addComment(outlineId: string, nodeId: string, content: string): Promise<void> {
    await simulateLatency();
    maybeThrowError();
    
    const outline = await outlinesApi.getOutline(outlineId);
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
        timestamp: new Date()
      } as ApiError;
    }
    
    const comment = {
      id: generateId(),
      userId: currentUser.id,
      content,
      createdAt: new Date(),
      replies: []
    };
    
    const findAndAddComment = (node: OutlineNode): boolean => {
      if (node.id === nodeId) {
        if (!node.metadata) {
          node.metadata = {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: currentUser.id,
            attachments: [],
            comments: [],
            linkedNodes: []
          };
        }
        
        if (!node.metadata.comments) {
          node.metadata.comments = [];
        }
        
        node.metadata.comments.push(comment);
        return true;
      }
      
      for (const child of node.children) {
        if (findAndAddComment(child)) return true;
      }
      
      return false;
    };
    
    if (!findAndAddComment(outline.rootNode)) {
      throw {
        code: 'NOT_FOUND',
        message: 'Node not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    await outlinesApi.updateOutline(outlineId, { rootNode: outline.rootNode });
  }
};

// Attachments API
export const attachmentsApi = {
  async uploadAttachment(outlineId: string, nodeId: string, file: File): Promise<Attachment> {
    await simulateLatency();
    maybeThrowError();
    
    const attachment: Attachment = {
      id: generateId(),
      filename: file.name,
      url: `https://storage.brainflowy.com/${generateId()}/${file.name}`,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date()
    };
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    const findAndAddAttachment = (node: OutlineNode): boolean => {
      if (node.id === nodeId) {
        if (!node.metadata) {
          node.metadata = {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: getCurrentUser()?.id || 'unknown',
            attachments: [],
            comments: [],
            linkedNodes: []
          };
        }
        
        if (!node.metadata.attachments) {
          node.metadata.attachments = [];
        }
        
        node.metadata.attachments.push(attachment);
        return true;
      }
      
      for (const child of node.children) {
        if (findAndAddAttachment(child)) return true;
      }
      
      return false;
    };
    
    if (!findAndAddAttachment(outline.rootNode)) {
      throw {
        code: 'NOT_FOUND',
        message: 'Node not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    await outlinesApi.updateOutline(outlineId, { rootNode: outline.rootNode });
    
    return attachment;
  },
  
  async deleteAttachment(outlineId: string, nodeId: string, attachmentId: string): Promise<void> {
    await simulateLatency();
    maybeThrowError();
    
    const outline = await outlinesApi.getOutline(outlineId);
    
    const findAndDeleteAttachment = (node: OutlineNode): boolean => {
      if (node.id === nodeId && node.metadata?.attachments) {
        const index = node.metadata.attachments.findIndex(a => a.id === attachmentId);
        if (index !== -1) {
          node.metadata.attachments.splice(index, 1);
          return true;
        }
      }
      
      for (const child of node.children) {
        if (findAndDeleteAttachment(child)) return true;
      }
      
      return false;
    };
    
    if (!findAndDeleteAttachment(outline.rootNode)) {
      throw {
        code: 'NOT_FOUND',
        message: 'Attachment not found',
        timestamp: new Date()
      } as ApiError;
    }
    
    await outlinesApi.updateOutline(outlineId, { rootNode: outline.rootNode });
  }
};

// WebSocket simulation for real-time updates
class MockWebSocket {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;
  private outlineId: string | undefined = undefined;
  
  connect(outlineId: string): void {
    this.outlineId = outlineId;
    this.isConnected = true;
    
    // Simulate random updates
    if (mockConfig.enableRealtimeSimulation) {
      this.simulateUpdates();
    }
  }
  
  disconnect(): void {
    this.isConnected = false;
    this.outlineId = undefined;
  }
  
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }
  
  emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
  
  private simulateUpdates(): void {
    if (!this.isConnected) return;
    
    // Simulate cursor movements
    setTimeout(() => {
      if (this.isConnected) {
        this.emit('cursor-move', {
          type: 'cursor-move',
          outlineId: this.outlineId,
          userId: mockUsers[1].id,
          data: {
            nodeId: generateId(),
            x: Math.random() * 800,
            y: Math.random() * 600,
            color: '#00ff00'
          },
          timestamp: new Date()
        } as RealtimeUpdate);
        
        this.simulateUpdates();
      }
    }, 5000 + Math.random() * 10000);
  }
}

export const websocket = new MockWebSocket();

// Export all APIs as a single object for convenience
export const mockApi = {
  auth: authApi,
  outlines: outlinesApi,
  nodes: nodesApi,
  templates: templatesApi,
  exportImport: exportImportApi,
  collaboration: collaborationApi,
  comments: commentsApi,
  attachments: attachmentsApi,
  websocket,
  config: mockConfig
};