# Surgical Update Architecture Plan

## Current Problem Analysis

### What Happens Now (INEFFICIENT)
Every single operation triggers full outline reconciliation:

```
User edits text → Desktop/Mobile component → onItemsChange(ENTIRE_OUTLINE) →
→ Fetch ALL backend items → Compare EVERYTHING → Update/Create/Delete by diff →
→ Re-render ENTIRE outline
```

### Performance Issues
1. **Edit 1 item** = Process N items
2. **Create 1 item** = Process N items + fetch all backend
3. **Delete 1 item** = Process N items
4. **Move 1 item** = Process N items
5. **LLM Edit** = Process N items + complex diffing
6. **LLM Create** = Process N items + complex diffing

## Proposed Architecture

### Core Principle
Each operation should be atomic and surgical - affect only the specific item(s) involved.

### Operation Types & Handlers

```typescript
interface OutlineOperations {
  // Single item operations
  createItem: (parentId: string | null, text: string, position?: number) => Promise<string>; // Returns ID
  updateItem: (itemId: string, updates: Partial<OutlineItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  moveItem: (itemId: string, newParentId: string | null, position: number) => Promise<void>;
  
  // LLM operations
  llmCreateItems: (parentId: string | null, items: LLMItem[], position?: number) => Promise<void>;
  llmEditItem: (itemId: string, newText: string, newChildren?: LLMItem[]) => Promise<void>;
  
  // Bulk operations
  applyTemplate: (items: OutlineItem[]) => Promise<void>;
}
```

## Implementation Plan

### Phase 1: Core Surgical Handlers

```typescript
// In OutlineView.tsx

const handleCreateItem = async (parentId: string | null, text: string, position?: number): Promise<string> => {
  if (!currentOutlineId) throw new Error('No outline ID');
  
  // 1. Create on backend - get real ID
  const newItem = await outlinesApi.createItem(currentOutlineId, {
    content: text,
    parentId,
    order: position
  });
  
  // 2. Surgical state update - insert only new item
  setItems(prevItems => {
    const updated = [...prevItems];
    
    if (!parentId) {
      // Root level - insert at position
      updated.splice(position ?? updated.length, 0, newItem);
    } else {
      // Find parent and add to children
      const insertIntoParent = (items: OutlineItem[]): boolean => {
        for (const item of items) {
          if (item.id === parentId) {
            if (!item.children) item.children = [];
            item.children.splice(position ?? item.children.length, 0, newItem);
            return true;
          }
          if (item.children && insertIntoParent(item.children)) {
            return true;
          }
        }
        return false;
      };
      insertIntoParent(updated);
    }
    
    return updated;
  });
  
  return newItem.id;
};

const handleUpdateItem = async (itemId: string, updates: Partial<OutlineItem>) => {
  if (!currentOutlineId) return;
  
  // 1. Update backend
  await outlinesApi.updateItem(currentOutlineId, itemId, {
    content: updates.text,
    style: updates.style,
    formatting: updates.formatting
  });
  
  // 2. Surgical state update - modify only target item
  setItems(prevItems => {
    const updateSingle = (items: OutlineItem[]): OutlineItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates };
        }
        if (item.children) {
          return { ...item, children: updateSingle(item.children) };
        }
        return item;
      });
    };
    return updateSingle(prevItems);
  });
};

const handleDeleteItem = async (itemId: string) => {
  if (!currentOutlineId) return;
  
  // 1. Delete from backend (deletes children too)
  await outlinesApi.deleteItem(currentOutlineId, itemId);
  
  // 2. Surgical state update - remove only target item
  setItems(prevItems => {
    const removeSingle = (items: OutlineItem[]): OutlineItem[] => {
      return items
        .filter(item => item.id !== itemId)
        .map(item => ({
          ...item,
          children: item.children ? removeSingle(item.children) : []
        }));
    };
    return removeSingle(prevItems);
  });
};
```

### Phase 2: LLM-Specific Operations

#### LLM CREATE (New items from AI)
```typescript
const handleLLMCreate = async (
  parentId: string | null, 
  llmItems: Array<{ text: string; children?: any[] }>,
  position?: number
) => {
  if (!currentOutlineId) return;
  
  // Recursive function to create items with children
  const createWithChildren = async (
    items: any[], 
    parentId: string | null
  ): Promise<OutlineItem[]> => {
    const created: OutlineItem[] = [];
    
    for (const item of items) {
      // Create the item on backend
      const newItem = await outlinesApi.createItem(currentOutlineId, {
        content: item.text,
        parentId,
        style: item.style,
        formatting: item.formatting
      });
      
      // If it has children, create them recursively
      if (item.children && item.children.length > 0) {
        newItem.children = await createWithChildren(item.children, newItem.id);
      } else {
        newItem.children = [];
      }
      
      created.push(newItem);
    }
    
    return created;
  };
  
  // Create all items
  const createdItems = await createWithChildren(llmItems, parentId);
  
  // Single state update with all new items
  setItems(prevItems => {
    const updated = [...prevItems];
    
    if (!parentId) {
      // Insert at root
      updated.splice(position ?? updated.length, 0, ...createdItems);
    } else {
      // Find parent and add children
      const insertIntoParent = (items: OutlineItem[]): boolean => {
        for (const item of items) {
          if (item.id === parentId) {
            if (!item.children) item.children = [];
            item.children.splice(position ?? item.children.length, 0, ...createdItems);
            return true;
          }
          if (item.children && insertIntoParent(item.children)) {
            return true;
          }
        }
        return false;
      };
      insertIntoParent(updated);
    }
    
    return updated;
  });
};
```

#### LLM EDIT (Modify existing item, potentially with new structure)
```typescript
const handleLLMEdit = async (
  itemId: string, 
  newText: string, 
  newChildren?: Array<{ text: string; children?: any[] }>
) => {
  if (!currentOutlineId) return;
  
  // 1. Update the main item text
  await outlinesApi.updateItem(currentOutlineId, itemId, { content: newText });
  
  // 2. Handle children if LLM provided new structure
  let createdChildren: OutlineItem[] = [];
  
  if (newChildren && newChildren.length > 0) {
    // Get current item's children for cleanup
    const currentItem = items.find(function findItem(item): boolean {
      if (item.id === itemId) return true;
      if (item.children) {
        return item.children.some(findItem);
      }
      return false;
    });
    
    // Delete existing children if any
    if (currentItem?.children && currentItem.children.length > 0) {
      await Promise.all(
        currentItem.children.map(child => 
          outlinesApi.deleteItem(currentOutlineId, child.id)
        )
      );
    }
    
    // Create new children structure
    const createChildren = async (
      items: any[], 
      parentId: string
    ): Promise<OutlineItem[]> => {
      const created: OutlineItem[] = [];
      
      for (const item of items) {
        const newItem = await outlinesApi.createItem(currentOutlineId, {
          content: item.text,
          parentId,
          style: item.style
        });
        
        if (item.children && item.children.length > 0) {
          newItem.children = await createChildren(item.children, newItem.id);
        } else {
          newItem.children = [];
        }
        
        created.push(newItem);
      }
      
      return created;
    };
    
    createdChildren = await createChildren(newChildren, itemId);
  }
  
  // 3. Single state update with all changes
  setItems(prevItems => {
    const updateWithChildren = (items: OutlineItem[]): OutlineItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            text: newText,
            children: createdChildren.length > 0 ? createdChildren : item.children
          };
        }
        if (item.children) {
          return { ...item, children: updateWithChildren(item.children) };
        }
        return item;
      });
    };
    return updateWithChildren(prevItems);
  });
};
```

### Phase 3: Update LLMAssistantPanel Integration

The LLM panel's `onApplyAction` callback needs to use the new handlers:

```typescript
// In OutlineDesktop.tsx

const handleLLMAction = async (action: LLMAction, response: LLMResponse) => {
  if (action.type === 'edit' && action.targetId) {
    // EDIT existing item
    if (response.content && !response.items) {
      // Simple text edit - no structural changes
      await onUpdateItem(action.targetId, { text: response.content });
    } else if (response.items && response.items.length > 0) {
      // Structural edit - item with new children
      await onLLMEditItem(
        action.targetId, 
        response.items[0].text,
        response.items[0].children
      );
    }
    
  } else if (action.type === 'create') {
    // CREATE new items
    if (response.items && response.items.length > 0) {
      // Determine parent and position
      const parentId = action.parentId || determineParentFromContext();
      const position = action.position || determinePositionFromContext();
      
      await onLLMCreateItems(parentId, response.items, position);
    }
    
  } else if (action.type === 'research') {
    // RESEARCH - might create or edit based on findings
    // Handle based on response type
    if (response.content && action.targetId) {
      await onUpdateItem(action.targetId, { text: response.content });
    } else if (response.items) {
      await onLLMCreateItems(action.parentId || null, response.items);
    }
  }
};
```

### Phase 4: Component Props Update

```typescript
interface OutlineDesktopProps {
  title: string;
  initialItems: OutlineItem[];
  outlineId: string | null;
  
  // Surgical operations
  onCreateItem: (parentId: string | null, text: string, position?: number) => Promise<string>;
  onUpdateItem: (itemId: string, updates: Partial<OutlineItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onMoveItem: (itemId: string, newParentId: string | null, position: number) => Promise<void>;
  
  // LLM operations
  onLLMCreateItems: (parentId: string | null, items: any[], position?: number) => Promise<void>;
  onLLMEditItem: (itemId: string, newText: string, newChildren?: any[]) => Promise<void>;
  
  // Template operation
  onApplyTemplate?: (items: OutlineItem[]) => Promise<void>;
}
```

## Testing Scenarios

### Manual Operations
- [ ] Type text in item → Only that item updates
- [ ] Create new item → Only new item appears
- [ ] Delete item → Only that item disappears
- [ ] Move item → Only that item moves

### LLM Operations
- [ ] LLM Create single item → Item appears without refresh
- [ ] LLM Create nested structure → All items appear correctly
- [ ] LLM Edit text only → Only text updates
- [ ] LLM Edit with children → Old children removed, new added
- [ ] LLM Research → Creates/updates as appropriate

### Persistence Tests
- [ ] Manual edit → Refresh → Persisted
- [ ] LLM Create → Refresh → All items persisted
- [ ] LLM Edit with children → Refresh → New structure persisted
- [ ] Delete LLM-created items → Refresh → Deleted

### Edge Cases
- [ ] LLM Edit on item that already has children
- [ ] LLM Create at specific position
- [ ] LLM Edit that removes all children
- [ ] Concurrent LLM operations

## Migration Strategy

### Step 1: Implement Core + LLM Handlers
- Add all handlers to OutlineView
- Keep old `handleItemsChange` as fallback

### Step 2: Update Components Gradually
1. Update manual text edits first
2. Update manual create/delete
3. Update LLM operations
4. Update template operations

### Step 3: Test Each Operation Type
- Test manual operations
- Test LLM Create variations
- Test LLM Edit variations
- Test persistence for all

### Step 4: Remove Old System
- Remove `handleItemsChange`
- Remove diffing logic
- Clean up unused code

## Success Criteria

- [ ] No full outline refresh for single operations
- [ ] LLM Create works without refresh
- [ ] LLM Edit preserves structure correctly
- [ ] All operations persist properly
- [ ] Performance noticeably improved
- [ ] Code is cleaner and more maintainable