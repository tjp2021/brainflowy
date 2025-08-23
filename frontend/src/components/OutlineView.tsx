import React, { useState, useEffect } from 'react';
import OutlineMobile from './OutlineMobile';
import OutlineDesktop from './OutlineDesktop';
import type { OutlineItem } from '@/types/outline';
import { outlinesApi } from '@/services/api/apiClient';
import { isNewItemId } from '@/utils/idGenerator';

interface OutlineViewProps {
  outlineId?: string;
}

const OutlineView: React.FC<OutlineViewProps> = ({ outlineId }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Work Notes');
  const [currentOutlineId, setCurrentOutlineId] = useState<string | null>(outlineId || null);
  const [saving, setSaving] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load outline data once for both mobile and desktop
  useEffect(() => {
    const loadOutlineData = async () => {
      try {
        const { outlinesApi, authApi } = await import('@/services/api/apiClient');
        const user = await authApi.getCurrentUser();
        
        if (user) {
          const outlines = await outlinesApi.getOutlines();
          
          if (outlines.length > 0) {
            setCurrentOutlineId(outlines[0].id);
            const backendItems = await outlinesApi.getOutlineItems(outlines[0].id);
            
            
            // The mock API returns hierarchical data with children already populated
            // We just need to map 'content' to 'text' and set the levels
            const mapHierarchicalItems = (items: any[], level: number = 0): OutlineItem[] => {
              return items.map(item => ({
                ...item,
                text: item.content || item.text || '',
                level: level,
                expanded: true,
                children: item.children ? mapHierarchicalItems(item.children, level + 1) : []
              }));
            };
            
            // Deduplicate items to prevent duplicate key warnings
            const deduplicateItems = (items: OutlineItem[]): OutlineItem[] => {
              const seen = new Set<string>();
              const deduplicated: OutlineItem[] = [];
              
              for (const item of items) {
                if (!seen.has(item.id)) {
                  seen.add(item.id);
                  // Also deduplicate children recursively
                  if (item.children && item.children.length > 0) {
                    item.children = deduplicateItems(item.children);
                  }
                  deduplicated.push(item);
                } else {
                  console.warn(`Duplicate item ID detected on load and removed: ${item.id}`);
                }
              }
              
              return deduplicated;
            };
            
            const hierarchicalItems = mapHierarchicalItems(backendItems);
            const deduplicatedItems = deduplicateItems(hierarchicalItems);
            setItems(deduplicatedItems);
          }
        }
      } catch (error) {
        console.error('Failed to load outline:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOutlineData();
  }, []);

  // ============================================================================
  // SURGICAL UPDATE HANDLERS - New efficient approach
  // ============================================================================
  
  /**
   * Create a single item surgically
   * @returns The ID of the created item
   */
  const handleCreateItem = async (
    parentId: string | null, 
    text: string, 
    position?: number,
    style?: OutlineItem['style'],
    formatting?: OutlineItem['formatting']
  ): Promise<string> => {
    if (!currentOutlineId) throw new Error('No outline ID');
    
    setSaving(true);
    try {
      // 1. Create on backend - get real ID
      const newItem = await outlinesApi.createItem(currentOutlineId, {
        content: text,
        parentId,
        order: position,
        style,
        formatting
      } as any);
      
      // 2. Surgical state update - insert only new item
      setItems(prevItems => {
        const updated = [...prevItems];
        
        if (!parentId) {
          // Root level - insert at position
          const itemWithHierarchy: OutlineItem = {
            ...newItem,
            text: newItem.content || text,
            level: 0,
            expanded: true,
            children: []
          };
          updated.splice(position ?? updated.length, 0, itemWithHierarchy);
        } else {
          // Find parent and add to children
          const insertIntoParent = (items: OutlineItem[]): boolean => {
            for (const item of items) {
              if (item.id === parentId) {
                if (!item.children) item.children = [];
                const childItem: OutlineItem = {
                  ...newItem,
                  text: newItem.content || text,
                  level: item.level + 1,
                  expanded: true,
                  children: []
                };
                item.children.splice(position ?? item.children.length, 0, childItem);
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
    } finally {
      setSaving(false);
    }
  };

  /**
   * Update a single item surgically
   */
  const handleUpdateItem = async (
    itemId: string, 
    updates: Partial<OutlineItem>
  ): Promise<void> => {
    if (!currentOutlineId) return;
    
    console.log('=== OutlineView handleUpdateItem ===');
    console.log('Updating item:', itemId, 'with:', updates);
    console.log('Current items before update:', items.map(i => ({ id: i.id, text: i.text })));
    
    setSaving(true);
    try {
      // 1. Update backend
      await outlinesApi.updateItem(currentOutlineId, itemId, {
        content: updates.text,
        style: updates.style,
        formatting: updates.formatting
      } as any);
      
      // 2. Surgical state update - modify only target item
      setItems(prevItems => {
        const updateSingle = (items: OutlineItem[]): OutlineItem[] => {
          return items.map(item => {
            if (item.id === itemId) {
              console.log('Found item to update:', item.id);
              return { ...item, ...updates };
            }
            if (item.children) {
              return { ...item, children: updateSingle(item.children) };
            }
            return item;
          });
        };
        const result = updateSingle(prevItems);
        console.log('Items after update:', result.map(i => ({ id: i.id, text: i.text })));
        return result;
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete a single item surgically
   */
  const handleDeleteItem = async (itemId: string): Promise<void> => {
    if (!currentOutlineId) return;
    
    setSaving(true);
    try {
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
    } finally {
      setSaving(false);
    }
  };

  /**
   * Move an item to a new position surgically
   */
  const handleMoveItem = async (
    itemId: string,
    newParentId: string | null,
    position: number
  ): Promise<void> => {
    if (!currentOutlineId) return;
    
    setSaving(true);
    try {
      // 1. Update on backend
      await outlinesApi.updateItem(currentOutlineId, itemId, {
        parentId: newParentId,
        order: position
      } as any);
      
      // 2. Surgical state update - move the item
      setItems(prevItems => {
        let movedItem: OutlineItem | null = null;
        
        // First, find and remove the item
        const removeAndCapture = (items: OutlineItem[]): OutlineItem[] => {
          return items
            .filter(item => {
              if (item.id === itemId) {
                movedItem = item;
                return false;
              }
              return true;
            })
            .map(item => ({
              ...item,
              children: item.children ? removeAndCapture(item.children) : []
            }));
        };
        
        const itemsWithoutMoved = removeAndCapture([...prevItems]);
        
        if (!movedItem) return prevItems;
        
        // Then, insert it at the new position
        if (!newParentId) {
          // Moving to root level
          movedItem.level = 0;
          movedItem.parentId = null;
          itemsWithoutMoved.splice(position, 0, movedItem);
        } else {
          // Moving to be a child of another item
          const insertIntoNewParent = (items: OutlineItem[]): boolean => {
            for (const item of items) {
              if (item.id === newParentId) {
                if (!item.children) item.children = [];
                movedItem!.level = item.level + 1;
                movedItem!.parentId = newParentId;
                // Update all child levels recursively
                const updateChildLevels = (children: OutlineItem[], baseLevel: number) => {
                  children.forEach(child => {
                    child.level = baseLevel + 1;
                    if (child.children) {
                      updateChildLevels(child.children, child.level);
                    }
                  });
                };
                if (movedItem!.children) {
                  updateChildLevels(movedItem!.children, movedItem!.level);
                }
                item.children.splice(position, 0, movedItem!);
                return true;
              }
              if (item.children && insertIntoNewParent(item.children)) {
                return true;
              }
            }
            return false;
          };
          insertIntoNewParent(itemsWithoutMoved);
        }
        
        return itemsWithoutMoved;
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // LLM-SPECIFIC OPERATIONS - For AI-generated content
  // ============================================================================
  
  /**
   * Create multiple items from LLM with hierarchy
   */
  const handleLLMCreateItems = async (
    parentId: string | null,
    llmItems: Array<{ text: string; style?: OutlineItem['style']; formatting?: OutlineItem['formatting']; children?: any[] }>,
    position?: number
  ): Promise<void> => {
    if (!currentOutlineId) return;
    
    setSaving(true);
    try {
      // Check for duplicate content before creating
      const isDuplicateContent = (text: string, parentId: string | null): boolean => {
        const normalizedText = text.toLowerCase().trim();
        
        const checkItems = (items: OutlineItem[], currentParentId: string | null = null): boolean => {
          for (const item of items) {
            // Check if same parent and similar content
            if (currentParentId === parentId && 
                item.text.toLowerCase().trim() === normalizedText) {
              return true;
            }
            // Check children recursively
            if (item.children && checkItems(item.children, item.id)) {
              return true;
            }
          }
          return false;
        };
        
        return checkItems(items, null);
      };
      
      // Recursive function to create items with children
      const createWithChildren = async (
        items: any[],
        parentId: string | null,
        parentLevel: number = 0
      ): Promise<OutlineItem[]> => {
        const created: OutlineItem[] = [];
        
        for (const item of items) {
          // Skip if duplicate content already exists in same location
          if (isDuplicateContent(item.text, parentId)) {
            console.warn(`Skipping duplicate content: "${item.text}" under parent ${parentId}`);
            continue;
          }
          
          // Create the item on backend
          const newItem = await outlinesApi.createItem(currentOutlineId, {
            content: item.text,
            parentId,
            style: item.style,
            formatting: item.formatting
          } as any);
          
          // Create the OutlineItem with proper hierarchy
          const outlineItem: OutlineItem = {
            ...newItem,
            text: newItem.content || item.text,
            level: parentLevel,
            expanded: true,
            children: []
          };
          
          // If it has children, create them recursively
          if (item.children && item.children.length > 0) {
            outlineItem.children = await createWithChildren(
              item.children, 
              newItem.id,
              parentLevel + 1
            );
          }
          
          created.push(outlineItem);
        }
        
        return created;
      };
      
      // Determine parent level for proper hierarchy
      let parentLevel = 0;
      if (parentId) {
        // Find parent's level
        const findParentLevel = (items: OutlineItem[]): number => {
          for (const item of items) {
            if (item.id === parentId) {
              return item.level + 1;
            }
            if (item.children) {
              const found = findParentLevel(item.children);
              if (found !== -1) return found;
            }
          }
          return -1;
        };
        parentLevel = findParentLevel(items);
        if (parentLevel === -1) parentLevel = 0;
      }
      
      // Create all items
      const createdItems = await createWithChildren(llmItems, parentId, parentLevel);
      
      // Deduplicate items by ID to prevent duplicate key warnings
      const deduplicateItems = (items: OutlineItem[]): OutlineItem[] => {
        const seen = new Set<string>();
        const deduplicated: OutlineItem[] = [];
        
        for (const item of items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            // Also deduplicate children recursively
            if (item.children && item.children.length > 0) {
              item.children = deduplicateItems(item.children);
            }
            deduplicated.push(item);
          } else {
            console.warn(`Duplicate item ID detected and removed: ${item.id}`);
          }
        }
        
        return deduplicated;
      };
      
      // Single state update with deduplicated new items
      setItems(prevItems => {
        const updated = [...prevItems];
        const deduplicatedNewItems = deduplicateItems(createdItems);
        
        if (!parentId) {
          // Insert at root
          updated.splice(position ?? updated.length, 0, ...deduplicatedNewItems);
        } else {
          // Find parent and add children
          const insertIntoParent = (items: OutlineItem[]): boolean => {
            for (const item of items) {
              if (item.id === parentId) {
                if (!item.children) item.children = [];
                item.children.splice(position ?? item.children.length, 0, ...deduplicatedNewItems);
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
        
        // Deduplicate the entire tree to ensure no duplicates exist
        return deduplicateItems(updated);
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Edit an item from LLM, potentially replacing its children
   */
  const handleLLMEditItem = async (
    itemId: string,
    newText: string,
    newChildren?: Array<{ text: string; style?: OutlineItem['style']; formatting?: OutlineItem['formatting']; children?: any[] }>
  ): Promise<void> => {
    if (!currentOutlineId) return;
    
    setSaving(true);
    try {
      // 1. Update the main item text
      await outlinesApi.updateItem(currentOutlineId, itemId, { 
        content: newText 
      } as any);
      
      // 2. Handle children if LLM provided new structure
      let createdChildren: OutlineItem[] = [];
      
      if (newChildren && newChildren.length > 0) {
        // Find current item to get its level and existing children
        let currentItem: OutlineItem | undefined;
        let itemLevel = 0;
        
        const findItem = (items: OutlineItem[]): boolean => {
          for (const item of items) {
            if (item.id === itemId) {
              currentItem = item;
              itemLevel = item.level;
              return true;
            }
            if (item.children && findItem(item.children)) {
              return true;
            }
          }
          return false;
        };
        findItem(items);
        
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
          parentId: string,
          parentLevel: number
        ): Promise<OutlineItem[]> => {
          const created: OutlineItem[] = [];
          
          for (const item of items) {
            const newItem = await outlinesApi.createItem(currentOutlineId, {
              content: item.text,
              parentId,
              style: item.style,
              formatting: item.formatting
            } as any);
            
            const outlineItem: OutlineItem = {
              ...newItem,
              text: newItem.content || item.text,
              level: parentLevel + 1,
              expanded: true,
              children: []
            };
            
            if (item.children && item.children.length > 0) {
              outlineItem.children = await createChildren(
                item.children, 
                newItem.id,
                parentLevel + 1
              );
            }
            
            created.push(outlineItem);
          }
          
          return created;
        };
        
        createdChildren = await createChildren(newChildren, itemId, itemLevel);
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
    } finally {
      setSaving(false);
    }
  };

  /**
   * Apply a template (replace all items)
   */
  const handleApplyTemplate = async (templateItems: OutlineItem[]): Promise<void> => {
    if (!currentOutlineId) return;
    
    setSaving(true);
    try {
      // Use the template API endpoint
      await outlinesApi.createFromTemplate(currentOutlineId, {
        items: templateItems,
        clearExisting: true
      });
      
      // Update state with new items
      setItems(templateItems);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // OLD INEFFICIENT HANDLER - To be removed after migration
  // ============================================================================
  
  const handleItemsChange = async (updatedItems: OutlineItem[]) => {
    
    // Use setTimeout to avoid setState during render warning
    setTimeout(() => {
      setItems(updatedItems);
    }, 0);
    
    // Save to backend if we have an outline ID
    if (currentOutlineId) {
      setSaving(true);
      try {
        // STEP 1: Get current backend state to compare
        const backendItems = await outlinesApi.getOutlineItems(currentOutlineId);
        
        // STEP 2: Build set of frontend IDs and their data
        const frontendItemsMap = new Map<string, OutlineItem>();
        const collectFrontendItems = (items: OutlineItem[], parentId: string | null = null) => {
          for (const item of items) {
            const isNewItem = isNewItemId(item.id);
            if (!isNewItem) {
              frontendItemsMap.set(item.id, { ...item, parentId });
            }
            if (item.children && item.children.length > 0) {
              collectFrontendItems(item.children, item.id);
            }
          }
        };
        collectFrontendItems(updatedItems);
        
        // STEP 3: Delete items that exist in backend but not in frontend
        const backendIds = new Set<string>();
        const collectBackendIds = (items: any[]) => {
          for (const item of items) {
            backendIds.add(item.id);
            if (item.children && item.children.length > 0) {
              collectBackendIds(item.children);
            }
          }
        };
        collectBackendIds(backendItems);
        
        // Delete items that are in backend but not in frontend
        for (const backendId of backendIds) {
          if (!frontendItemsMap.has(backendId)) {
            try {
              await outlinesApi.deleteItem(currentOutlineId, backendId);
            } catch (error) {
              console.error(`Failed to delete item ${backendId}:`, error);
            }
          }
        }
        
        // STEP 4: Update existing items (content and parentId)
        for (const [itemId, frontendItem] of frontendItemsMap) {
          try {
            await outlinesApi.updateItem(currentOutlineId, itemId, {
              content: frontendItem.text,
              parentId: frontendItem.parentId,
              style: frontendItem.style,
              formatting: frontendItem.formatting
            } as any);
          } catch (error) {
            console.error(`Failed to update item ${itemId}:`, error);
          }
        }
        
        // Map to track old ID -> new ID mappings
        const idMap = new Map<string, string>();
        
        // STEP 5: Create any new items
        const processNewItems = async (items: OutlineItem[], parentId: string | null = null): Promise<void> => {
          for (const item of items) {
            // Check if this is a new item (temporary IDs are exactly 13 digits after item_)
            // Backend IDs have additional suffixes like item_1755834646913665_366
            const isNewItem = isNewItemId(item.id);
            if (isNewItem) {
              // Skip items without text or with default "New Item" text
              if (!item.text || item.text === 'New Item' || item.text.trim() === '') {
                continue;
              }
              
              // Resolve the actual parentId (in case parent was also new)
              const actualParentId = item.parentId ? (idMap.get(item.parentId) || item.parentId) : parentId;
              
              const created = await outlinesApi.createItem(currentOutlineId, {
                content: item.text,
                parentId: actualParentId,
                style: item.style,
                formatting: item.formatting
              } as any);
              
              // Store the ID mapping
              idMap.set(item.id, created.id);
              
              // Update the item's ID in place
              item.id = created.id;
            }
            
            // Process children recursively
            if (item.children && item.children.length > 0) {
              await processNewItems(item.children, item.id);
            }
          }
        };
        
        // Process all items
        await processNewItems(updatedItems);
        
        // Update the items with new IDs
        setTimeout(() => {
          setItems([...updatedItems]);
        }, 0);
      } catch (error) {
        console.error('Failed to save items:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading outline...</div>
      </div>
    );
  }

  return (
    <>
      {saving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm z-50">
          Saving...
        </div>
      )}
      {isMobile ? (
        <OutlineMobile 
          title={title}
          initialItems={items} 
          onItemsChange={handleItemsChange}
          // Surgical operations
          onCreateItem={handleCreateItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onMoveItem={handleMoveItem}
          // LLM operations
          onLLMCreateItems={handleLLMCreateItems}
          onLLMEditItem={handleLLMEditItem}
          onApplyTemplate={handleApplyTemplate}
        />
      ) : (
        <OutlineDesktop 
          title={title}
          initialItems={items} 
          onItemsChange={handleItemsChange}
          outlineId={currentOutlineId}
          // Surgical operations
          onCreateItem={handleCreateItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onMoveItem={handleMoveItem}
          // LLM operations
          onLLMCreateItems={handleLLMCreateItems}
          onLLMEditItem={handleLLMEditItem}
          onApplyTemplate={handleApplyTemplate}
        />
      )}
    </>
  );
};

// Helper function removed - now using unified utility from hierarchyUtils.ts

// Sample data for development
function getSampleOutlineData(): OutlineItem[] {
  return [
    {
      id: '1',
      text: 'Marketing Campaign',
      level: 0,
      expanded: true,
      style: 'header',
      formatting: { bold: true, size: 'large' },
      children: [
        {
          id: '2',
          text: 'Social Media Strategy',
          level: 1,
          expanded: true,
          style: 'header',
          formatting: { bold: true, size: 'medium' },
          children: [
            { id: '3', text: 'Instagram content calendar', level: 2, expanded: false, children: [] },
            { id: '4', text: 'TikTok video series', level: 2, expanded: false, children: [] },
            { 
              id: '4a', 
              text: 'const videoConfig = { format: "vertical", duration: 60 };', 
              level: 2, 
              expanded: false, 
              style: 'code',
              children: [] 
            }
          ]
        },
        { id: '5', text: 'Budget planning', level: 1, expanded: false, children: [] },
        { 
          id: '6', 
          text: 'As Steve Jobs said, "Innovation distinguishes between a leader and a follower."', 
          level: 1, 
          expanded: false, 
          style: 'quote',
          formatting: { italic: true },
          children: [] 
        }
      ]
    },
    {
      id: '7',
      text: 'Product Launch',
      level: 0,
      expanded: false,
      style: 'header',
      formatting: { bold: true, size: 'large' },
      children: [
        { id: '8', text: 'Beta testing feedback', level: 1, expanded: false, children: [] },
        { id: '9', text: 'Launch timeline', level: 1, expanded: false, children: [] }
      ]
    },
    {
      id: '10',
      text: 'Technical Implementation',
      level: 0,
      expanded: true,
      style: 'header',
      formatting: { bold: true, size: 'large' },
      children: [
        { id: '11', text: 'API endpoints to implement', level: 1, expanded: false, children: [] },
        { 
          id: '12', 
          text: 'async function fetchUserData() { return await api.get("/users"); }', 
          level: 1, 
          expanded: false, 
          style: 'code',
          children: [] 
        }
      ]
    }
  ];
}

export default OutlineView;