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
  async getOutlines(userId: string): Promise<Outline[]> {
    await simulateDelay();
    
    const userOutlines = Array.from(mockOutlines.values())
      .filter(outline => outline.userId === userId);
    
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

  async createOutline(title: string, userId: string): Promise<Outline> {
    await simulateDelay();
    
    const outline: Outline = {
      id: `outline_${Date.now()}`,
      title,
      userId,
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

  async deleteItem(itemId: string): Promise<void> {
    await simulateDelay();
    
    for (const [outlineId, items] of mockItems.entries()) {
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
};

// Initialize sample data
initSampleData();

// Export with alternate name for compatibility
export const mockOutlinesService = mockOutlineService;