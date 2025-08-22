// Mock Outlines Service
// This will be replaced with real API calls in Phase 3

export interface OutlineItem {
  id: string;
  content: string;
  parentId: string | null;
  outlineId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  children?: OutlineItem[];
}

export interface Outline {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

// Simulated delay for network requests
const simulateDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock database
const mockOutlines: Map<string, Outline> = new Map();
const mockItems: Map<string, OutlineItem[]> = new Map();

// Initialize with sample data
const initSampleData = () => {
  const sampleOutline: Outline = {
    id: 'outline_1',
    title: 'Welcome to BrainFlowy',
    userId: 'user_test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itemCount: 6,
  };

  const sampleItems: OutlineItem[] = [
    {
      id: 'item_1',
      content: 'Getting Started with BrainFlowy',
      parentId: null,
      outlineId: 'outline_1',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'item_2',
      content: 'Create hierarchical outlines',
      parentId: 'item_1',
      outlineId: 'outline_1',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'item_3',
      content: 'Use voice input for quick capture',
      parentId: 'item_1',
      outlineId: 'outline_1',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'item_4',
      content: 'Key Features',
      parentId: null,
      outlineId: 'outline_1',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'item_5',
      content: 'Mobile-first design with 44px touch targets',
      parentId: 'item_4',
      outlineId: 'outline_1',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'item_6',
      content: 'Swipe gestures for indent/outdent',
      parentId: 'item_4',
      outlineId: 'outline_1',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  mockOutlines.set('outline_1', sampleOutline);
  mockItems.set('outline_1', sampleItems);
};

export const mockOutlineService = {
  async getOutlines(userId?: string): Promise<Outline[]> {
    await simulateDelay();
    
    const userOutlines = userId 
      ? Array.from(mockOutlines.values()).filter(outline => outline.userId === userId)
      : Array.from(mockOutlines.values());
    
    return userOutlines;
  },

  async getOutline(outlineId: string): Promise<Outline> {
    await simulateDelay();
    
    const outline = mockOutlines.get(outlineId);
    if (!outline) {
      throw new Error('Outline not found');
    }
    
    return outline;
  },

  async createOutline(data: { title: string; userId: string }): Promise<Outline> {
    await simulateDelay();
    
    const outline: Outline = {
      id: `outline_${Date.now()}`,
      title: data.title,
      userId: data.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itemCount: 0,
    };
    
    mockOutlines.set(outline.id, outline);
    mockItems.set(outline.id, []);
    
    return outline;
  },

  async updateOutline(outlineId: string, title: string): Promise<Outline> {
    await simulateDelay();
    
    const outline = mockOutlines.get(outlineId);
    if (!outline) {
      throw new Error('Outline not found');
    }
    
    outline.title = title;
    outline.updatedAt = new Date().toISOString();
    
    return outline;
  },

  async deleteOutline(outlineId: string): Promise<void> {
    await simulateDelay();
    
    mockOutlines.delete(outlineId);
    mockItems.delete(outlineId);
  },

  async getOutlineItems(outlineId: string): Promise<OutlineItem[]> {
    await simulateDelay();
    
    const items = mockItems.get(outlineId) || [];
    return this.buildItemTree(items);
  },

  async createItem(
    outlineId: string,
    content: string,
    parentId: string | null = null
  ): Promise<OutlineItem> {
    await simulateDelay();
    
    const items = mockItems.get(outlineId) || [];
    const siblingCount = items.filter(item => item.parentId === parentId).length;
    
    const newItem: OutlineItem = {
      id: `item_${Date.now()}`,
      content,
      parentId,
      outlineId,
      order: siblingCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    items.push(newItem);
    mockItems.set(outlineId, items);
    
    // Update outline item count
    const outline = mockOutlines.get(outlineId);
    if (outline) {
      outline.itemCount++;
      outline.updatedAt = new Date().toISOString();
    }
    
    return newItem;
  },

  async updateItem(itemId: string, content: string): Promise<OutlineItem> {
    await simulateDelay();
    
    for (const [outlineId, items] of mockItems.entries()) {
      const item = items.find(i => i.id === itemId);
      if (item) {
        item.content = content;
        item.updatedAt = new Date().toISOString();
        
        const outline = mockOutlines.get(outlineId);
        if (outline) {
          outline.updatedAt = new Date().toISOString();
        }
        
        return item;
      }
    }
    
    throw new Error('Item not found');
  },

  async deleteItem(outlineId: string, itemId: string): Promise<void> {
    await simulateDelay();
    
    const items = mockItems.get(outlineId);
    if (!items) {
      throw new Error('Outline not found');
    }
    
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      // Delete item and all children
      const toDelete = this.getItemWithChildren(items, itemId);
      const updatedItems = items.filter(item => !toDelete.includes(item.id));
      mockItems.set(outlineId, updatedItems);
      
      // Update outline
      const outline = mockOutlines.get(outlineId);
      if (outline) {
        outline.itemCount = updatedItems.length;
        outline.updatedAt = new Date().toISOString();
      }
      
      return;
    }
    
    throw new Error('Item not found');
  },

  async indentItem(itemId: string): Promise<void> {
    await simulateDelay();
    
    for (const [_outlineId, items] of mockItems.entries()) {
      const item = items.find(i => i.id === itemId);
      if (item) {
        // Find previous sibling to become new parent
        const siblings = items.filter(i => i.parentId === item.parentId);
        const currentIndex = siblings.findIndex(i => i.id === itemId);
        
        if (currentIndex > 0) {
          const newParent = siblings[currentIndex - 1];
          item.parentId = newParent.id;
          item.order = items.filter(i => i.parentId === newParent.id).length - 1;
          item.updatedAt = new Date().toISOString();
        }
        
        return;
      }
    }
  },

  async outdentItem(itemId: string): Promise<void> {
    await simulateDelay();
    
    for (const [_outlineId, items] of mockItems.entries()) {
      const item = items.find(i => i.id === itemId);
      if (item && item.parentId) {
        const parent = items.find(i => i.id === item.parentId);
        if (parent) {
          item.parentId = parent.parentId;
          item.order = items.filter(i => i.parentId === parent.parentId).length;
          item.updatedAt = new Date().toISOString();
        }
        
        return;
      }
    }
  },

  // Helper methods
  buildItemTree(items: OutlineItem[]): OutlineItem[] {
    const itemMap = new Map<string, OutlineItem>();
    const rootItems: OutlineItem[] = [];

    // First pass: create a map
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree
    items.forEach(item => {
      const mappedItem = itemMap.get(item.id)!;
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(mappedItem);
        }
      } else {
        rootItems.push(mappedItem);
      }
    });

    // Sort by order
    const sortByOrder = (items: OutlineItem[]) => {
      items.sort((a, b) => a.order - b.order);
      items.forEach(item => {
        if (item.children) {
          sortByOrder(item.children);
        }
      });
    };

    sortByOrder(rootItems);
    return rootItems;
  },

  getItemWithChildren(items: OutlineItem[], itemId: string): string[] {
    const result: string[] = [itemId];
    const children = items.filter(i => i.parentId === itemId);
    
    children.forEach(child => {
      result.push(...this.getItemWithChildren(items, child.id));
    });
    
    return result;
  },

  // Batch operations (mock implementation)
  async batchOperations(outlineId: string, request: { operations: any[] }): Promise<any> {
    const items = mockItems.get(outlineId) || [];
    const errors: string[] = [];
    
    for (const op of request.operations) {
      try {
        if (op.type === 'CREATE') {
          const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: op.data?.text || op.data?.content || '',
            parentId: op.parentId || null,
            outlineId,
            order: op.position || 0,
            style: op.data?.style,
            formatting: op.data?.formatting,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          items.push(newItem);
        } else if (op.type === 'UPDATE') {
          const item = items.find(i => i.id === op.id);
          if (item) {
            if (op.data?.text || op.data?.content) {
              item.content = op.data.text || op.data.content;
            }
            if (op.data?.style !== undefined) item.style = op.data.style;
            if (op.data?.formatting !== undefined) item.formatting = op.data.formatting;
            if (op.parentId !== undefined) item.parentId = op.parentId;
            item.updatedAt = new Date();
          }
        } else if (op.type === 'DELETE') {
          const index = items.findIndex(i => i.id === op.id);
          if (index !== -1) {
            items.splice(index, 1);
          }
        }
      } catch (error: any) {
        errors.push(`Operation ${op.type} failed: ${error.message}`);
      }
    }
    
    mockItems.set(outlineId, items);
    
    // Build hierarchical response
    const hierarchicalItems = buildHierarchicalStructure(items);
    
    return {
      success: errors.length === 0,
      items: hierarchicalItems,
      errors
    };
  },

  // Template operations (mock implementation)
  async createFromTemplate(outlineId: string, request: { items: any[], clearExisting?: boolean }): Promise<any[]> {
    if (request.clearExisting) {
      mockItems.set(outlineId, []);
    }
    
    const items = mockItems.get(outlineId) || [];
    
    const createItemsRecursive = (templateItems: any[], parentId: string | null = null): any[] => {
      const created: any[] = [];
      
      for (const templateItem of templateItems) {
        const newItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: templateItem.text || templateItem.content || '',
          parentId,
          outlineId,
          order: items.length,
          style: templateItem.style,
          formatting: templateItem.formatting,
          createdAt: new Date(),
          updatedAt: new Date(),
          children: []
        };
        
        items.push(newItem);
        
        if (templateItem.children && templateItem.children.length > 0) {
          newItem.children = createItemsRecursive(templateItem.children, newItem.id);
        }
        
        created.push(newItem);
      }
      
      return created;
    };
    
    const hierarchicalItems = createItemsRecursive(request.items);
    mockItems.set(outlineId, items);
    
    return hierarchicalItems;
  },
};

// Initialize sample data only if it doesn't exist
// Also check if we have way too many items (indicates duplication bug)
const existingItems = mockItems.get('outline_1') || [];
if (mockOutlines.size === 0) {
  initSampleData();
} else if (existingItems.length > 500) {
  // Clear and reinitialize if we have accumulated too many items
  console.warn('Mock data corruption detected - clearing and reinitializing');
  mockOutlines.clear();
  mockItems.clear();
  initSampleData();
}

// Export with alternate name for compatibility
export const mockOutlinesService = mockOutlineService;