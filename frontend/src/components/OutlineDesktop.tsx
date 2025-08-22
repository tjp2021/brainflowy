import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Mic, Search, ChevronRight, ChevronDown, ChevronLeft, 
  Folder, MoreHorizontal, GripVertical, FileText,
  Sparkles, LogOut, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { generateNewItemId } from '@/utils/idGenerator';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OutlineItem } from '@/types/outline';
import VoiceModal from './VoiceModal';
import { createBrainliftTemplate } from '@/templates/brainliftTemplate';
import LLMAssistantPanel, { type LLMAction, type LLMResponse } from './LLMAssistantPanel';
import { outlinesApi, authApi } from '@/services/api/apiClient';
import '../styles/outline.css';

interface OutlineDesktopProps {
  title?: string;
  initialItems?: OutlineItem[];
  onItemsChange?: (items: OutlineItem[]) => void;
  outlineId?: string | null;
  sidebarItems?: Array<{
    id: string;
    name: string;
    icon: React.ElementType;
    active: boolean;
  }>;
  // Surgical operations
  onCreateItem?: (parentId: string | null, text: string, position?: number, style?: OutlineItem['style'], formatting?: OutlineItem['formatting']) => Promise<string>;
  onUpdateItem?: (itemId: string, updates: Partial<OutlineItem>) => Promise<void>;
  onDeleteItem?: (itemId: string) => Promise<void>;
  onMoveItem?: (itemId: string, newParentId: string | null, position: number) => Promise<void>;
  // LLM operations
  onLLMCreateItems?: (parentId: string | null, items: any[], position?: number) => Promise<void>;
  onLLMEditItem?: (itemId: string, newText: string, newChildren?: any[]) => Promise<void>;
  onApplyTemplate?: (items: OutlineItem[]) => Promise<void>;
}

const OutlineDesktop: React.FC<OutlineDesktopProps> = ({ 
  title = 'Work Notes',
  initialItems = [],
  onItemsChange,
  outlineId,
  // Surgical operations
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
  // LLM operations
  onLLMCreateItems,
  onLLMEditItem,
  onApplyTemplate
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [outline, setOutline] = useState<OutlineItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'header' | 'code' | 'quote' | 'normal'>('normal');
  const [userOutlines, setUserOutlines] = useState<any[]>([]);
  const [currentOutlineId, setCurrentOutlineId] = useState<string | null>(outlineId || null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Sync outline with initialItems when they change (e.g., after LLM operations)
  useEffect(() => {
    setOutline(initialItems);
  }, [initialItems]);
  
  // Sync currentOutlineId to localStorage whenever it changes
  useEffect(() => {
    if (currentOutlineId) {
      localStorage.setItem('currentOutlineId', currentOutlineId);
      console.log('Stored outline ID in localStorage:', currentOutlineId);
    }
  }, [currentOutlineId]);
  const [outlineTitle, setOutlineTitle] = useState(title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isLoadingOutlines, setIsLoadingOutlines] = useState(false);
  const [showNewOutlineDialog, setShowNewOutlineDialog] = useState(false);
  const [newOutlineName, setNewOutlineName] = useState('');
  const [showLLMAssistant, setShowLLMAssistant] = useState(false);
  const [llmCurrentItem, setLLMCurrentItem] = useState<OutlineItem | null>(null);
  const [llmCurrentSection, setLLMCurrentSection] = useState<string | undefined>();
  const [llmInitialPrompt, setLLMInitialPrompt] = useState<string>('');
  const textAreaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  // Helper to recalculate levels for all items
  const recalculateLevels = (items: OutlineItem[], level: number = 0): OutlineItem[] => {
    return items.map(item => ({
      ...item,
      level: level,
      children: item.children ? recalculateLevels(item.children, level + 1) : []
    }));
  };

  // Flatten outline for rendering
  const flattenOutline = (items: OutlineItem[], result: OutlineItem[] = []): OutlineItem[] => {
    items.forEach(item => {
      result.push(item);
      if (item.expanded && item.children.length > 0) {
        flattenOutline(item.children, result);
      }
    });
    return result;
  };

  const flatItems = flattenOutline(outline);
  
  // Debug log to see what we're rendering
  if (flatItems.length > 0) {
    console.log('FLAT ITEMS FOR RENDER:', flatItems.map(i => ({ 
      text: i.text, 
      level: i.level, 
      padding: `${(i.level || 0) * 24 + 8}px` 
    })));
  }
  
  // Filter items based on search query and include parent context
  const getFilteredItemsWithContext = () => {
    if (!searchQuery) return { items: flatItems, matchingIds: new Set<string>() };
    
    const matchingIds = new Set<string>();
    const parentIds = new Set<string>();
    
    // Find all matching items and their parents
    flatItems.forEach(item => {
      if (item.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        matchingIds.add(item.id);
        // Add all parent IDs up the chain
        let currentItem = item;
        while (currentItem.parentId) {
          parentIds.add(currentItem.parentId);
          currentItem = flatItems.find(i => i.id === currentItem.parentId) || currentItem;
          if (currentItem === item) break; // Prevent infinite loop
        }
      }
    });
    
    // Return items that match or are parents of matches
    const items = flatItems.filter(item => 
      matchingIds.has(item.id) || parentIds.has(item.id)
    );
    
    return { items, matchingIds };
  };
  
  const { items: filteredItems, matchingIds } = getFilteredItemsWithContext();
  const searchResultCount = searchQuery ? matchingIds.size : 0;
  
  // Helper to highlight search terms in text
  const highlightSearchTerm = (text: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-black">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Load user's outlines on mount
  useEffect(() => {
    const loadUserOutlines = async () => {
      // Prevent duplicate loads
      if (isLoadingOutlines) return;
      setIsLoadingOutlines(true);
      
      try {
        const user = await authApi.getCurrentUser();
        
        if (!user) {
          console.error('User not authenticated');
          return;
        }
        
        // Pass the user ID correctly - the backend expects it as a query parameter
        const outlines = await outlinesApi.getOutlines();
        
        // If no outlines exist, create a default one
        if (!outlines || outlines.length === 0) {
          const newOutline = await outlinesApi.createOutline({
            title: 'My First Outline',
            userId: user.id
          });
          setUserOutlines([newOutline]);
          setCurrentOutlineId(newOutline.id);
          setOutlineTitle(newOutline.title);
          setOutline([]);
        } else {
          setUserOutlines(outlines);
          
          // Determine which outline to load
          let outlineToLoad = currentOutlineId;
          
          // If no current outline ID or it doesn't exist in the list, use first outline
          if (!outlineToLoad || !outlines.find(o => o.id === outlineToLoad)) {
            outlineToLoad = outlines[0]?.id;
          }
          
          if (outlineToLoad) {
            const outlineData = outlines.find(o => o.id === outlineToLoad) || outlines[0];
            setCurrentOutlineId(outlineToLoad);
            setOutlineTitle(outlineData.title);
            
            // Always load items for the current outline
            const items = await outlinesApi.getOutlineItems(outlineToLoad);
            
            // Convert backend format to frontend format recursively with level calculation
            const convertItems = (items: any[], level: number = 0): OutlineItem[] => {
              return items.map((item: any) => {
                const convertedItem: OutlineItem = {
                  ...item,
                  text: item.content || item.text || '',
                  level: level,  // SET THE LEVEL FOR INDENTATION
                  expanded: true, // Default to expanded to show all items
                  children: []
                };
                // Recursively convert children with incremented level
                if (item.children && item.children.length > 0) {
                  convertedItem.children = convertItems(item.children, level + 1);
                }
                return convertedItem;
              });
            };
            const convertedItems = convertItems(items);
            
            // Debug: flatten and log
            const debugFlatten = (items: any[], result: any[] = []): any[] => {
              items.forEach(item => {
                result.push({ text: item.text, level: item.level });
                if (item.children && item.children.length > 0) {
                  debugFlatten(item.children, result);
                }
              });
              return result;
            };
            
            setOutline(convertedItems);
          }
        }
      } catch (error) {
        console.error('Failed to load outlines:', error);
      } finally {
        setIsLoadingOutlines(false);
      }
    };
    
    // Only load if we haven't started loading yet
    if (!isLoadingOutlines && userOutlines.length === 0) {
      loadUserOutlines();
    }
  }, [isLoadingOutlines, userOutlines.length]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+A - Select all items
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        // Don't prevent default if user is in a text field
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        
        e.preventDefault();
        const allItemIds = new Set<string>();
        const collectAllIds = (items: OutlineItem[]) => {
          items.forEach(item => {
            allItemIds.add(item.id);
            if (item.children && item.children.length > 0) {
              collectAllIds(item.children);
            }
          });
        };
        collectAllIds(outline);
        setSelectedItems(allItemIds);
      }
      
      // Delete key - Delete selected items
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is typing in a text field
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        
        if (selectedItems.size > 0) {
          e.preventDefault();
          // Confirm deletion
          if (window.confirm(`Delete ${selectedItems.size} selected item(s)?`)) {
            // Use surgical delete if available
            if (onDeleteItem) {
              // Delete each selected item surgically
              Promise.all(Array.from(selectedItems).map(itemId => 
                onDeleteItem(itemId)
              )).then(() => {
                // Update local state to remove deleted items
                const deleteSelectedItems = (items: OutlineItem[]): OutlineItem[] => {
                  return items.filter(item => {
                    if (!selectedItems.has(item.id)) {
                      if (item.children && item.children.length > 0) {
                        item.children = deleteSelectedItems(item.children);
                      }
                      return true;
                    }
                    return false;
                  });
                };
                
                const updated = deleteSelectedItems(outline);
                setOutline(updated);
                setSelectedItems(new Set());
              });
            } else {
              // Fallback to old method
              const deleteSelectedItems = (items: OutlineItem[]): OutlineItem[] => {
                return items.filter(item => {
                  // Keep item if not selected
                  if (!selectedItems.has(item.id)) {
                    // But check children
                    if (item.children && item.children.length > 0) {
                      item.children = deleteSelectedItems(item.children);
                    }
                    return true;
                  }
                  return false; // Remove selected items
                });
              };
              
              const updated = deleteSelectedItems(outline);
              setOutline(updated);
              // REMOVED: onItemsChange - using surgical delete above
              setSelectedItems(new Set()); // Clear selection after deletion
            }
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [outline, selectedItems, onItemsChange]);

  const handleSaveTitle = async () => {
    if (!tempTitle.trim() || tempTitle === outlineTitle) {
      setIsEditingTitle(false);
      setTempTitle(outlineTitle);
      return;
    }

    try {
      const { outlinesApi } = await import('@/services/api/apiClient');
      await outlinesApi.updateOutline(currentOutlineId, { title: tempTitle.trim() });
      setOutlineTitle(tempTitle.trim());
      setIsEditingTitle(false);
      
      // Update the title in the sidebar list as well
      setUserOutlines(userOutlines.map(o => 
        o.id === currentOutlineId ? { ...o, title: tempTitle.trim() } : o
      ));
    } catch (error) {
      console.error('Failed to update outline title:', error);
      setTempTitle(outlineTitle);
      setIsEditingTitle(false);
    }
  };

  const selectOutline = async (outlineId: string) => {
    try {
      const { outlinesApi } = await import('@/services/api/apiClient');
      const outline = await outlinesApi.getOutline(outlineId);
      const items = await outlinesApi.getOutlineItems(outlineId);
      
      setCurrentOutlineId(outlineId);
      setOutlineTitle(outline.title);
      setTempTitle(outline.title);
      // Convert backend format to frontend format recursively with level calculation
      const convertItems = (items: any[], level: number = 0): OutlineItem[] => {
        return items.map((item: any) => ({
          ...item,
          text: item.content || item.text || '',
          level: level,  // SET THE LEVEL FOR INDENTATION
          expanded: true, // Default to expanded to show all items
          children: item.children ? convertItems(item.children, level + 1) : []
        }));
      };
      const convertedItems = convertItems(items);
      setOutline(convertedItems);
    } catch (error) {
      console.error('Failed to load outline:', error);
    }
  };

  const createNewOutline = async (outlineName?: string) => {
    try {
      const { outlinesApi, authApi } = await import('@/services/api/apiClient');
      const user = await authApi.getCurrentUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      
      const newOutline = await outlinesApi.createOutline({
        title: outlineName || `New Outline ${new Date().toLocaleDateString()}`,
        userId: user.id
      });
      
      setUserOutlines([...userOutlines, newOutline]);
      await selectOutline(newOutline.id);
      setShowNewOutlineDialog(false);
      setNewOutlineName('');
    } catch (error) {
      console.error('Failed to create outline:', error);
    }
  };

  const handleNewOutlineSubmit = () => {
    if (newOutlineName.trim()) {
      createNewOutline(newOutlineName.trim());
    }
  };

  const toggleExpanded = async (itemId: string) => {
    // Find the item's current expanded state
    let currentExpanded = false;
    const findItem = (items: OutlineItem[]): boolean => {
      for (const item of items) {
        if (item.id === itemId) {
          currentExpanded = item.expanded;
          return true;
        }
        if (item.children && findItem(item.children)) {
          return true;
        }
      }
      return false;
    };
    findItem(outline);
    
    // Use surgical update if available
    if (onUpdateItem) {
      await onUpdateItem(itemId, { expanded: !currentExpanded });
    }
    
    // Always update local state for immediate UI response
    const updateItems = (items: OutlineItem[]): OutlineItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, expanded: !item.expanded };
        }
        if (item.children.length > 0) {
          return { ...item, children: updateItems(item.children) };
        }
        return item;
      });
    };
    setOutline(updateItems(outline));
  };

  const startEditing = (itemId: string) => {
    setEditingId(itemId);
    setTimeout(() => {
      const textarea = textAreaRefs.current[itemId];
      if (textarea) {
        textarea.focus();
        // Clear "New item" placeholder text when starting to edit
        if (textarea.value === 'New item') {
          textarea.value = '';
        }
        // Select all text for easy replacement
        textarea.select();
      }
    }, 0);
  };

  const stopEditing = () => {
    setEditingId(null);
  };

  const updateItemText = async (itemId: string, newText: string): Promise<void> => {
    // Use surgical update if available, otherwise fall back to old method
    if (onUpdateItem) {
      // For new items (temporary IDs), we need to create them instead
      if (itemId.match(/^item_\d{13}$/)) {
        // Find the item and its parent
        let foundItem: OutlineItem | null = null;
        let parentId: string | null = null;
        
        const findItemAndParent = (items: OutlineItem[], parent: string | null = null): void => {
          for (const item of items) {
            if (item.id === itemId) {
              foundItem = item;
              parentId = parent;
              return;
            }
            if (item.children.length > 0) {
              findItemAndParent(item.children, item.id);
            }
          }
        };
        
        findItemAndParent(outline);
        
        if (foundItem && newText.trim() && onCreateItem) {
          // Create the item and get the real ID
          const newId = await onCreateItem(
            parentId, 
            newText, 
            undefined,
            foundItem.style || 'normal',
            foundItem.formatting
          );
          
          // Remove the temporary item from local state since onCreateItem adds the real one
          setOutline(prevOutline => {
            const removeTemp = (items: OutlineItem[]): OutlineItem[] => {
              return items.reduce((acc: OutlineItem[], item) => {
                if (item.id === itemId) {
                  // Skip the temporary item
                  return acc;
                }
                if (item.children.length > 0) {
                  // Process children recursively
                  acc.push({ ...item, children: removeTemp(item.children) });
                } else {
                  acc.push(item);
                }
                return acc;
              }, []);
            };
            return removeTemp(prevOutline);
          });
          
          console.log('Created item with real ID:', newId, 'and removed temp ID:', itemId);
        }
      } else {
        // Update existing item surgically
        await onUpdateItem(itemId, { text: newText });
        
        // Update local state optimistically
        setOutline(prevOutline => {
          const updateItems = (items: OutlineItem[]): OutlineItem[] => {
            return items.map(item => {
              if (item.id === itemId) {
                return { ...item, text: newText };
              }
              if (item.children.length > 0) {
                return { ...item, children: updateItems(item.children) };
              }
              return item;
            });
          };
          return updateItems(prevOutline);
        });
      }
    } else {
      // Fallback to old method if surgical handlers not available
      return new Promise((resolve) => {
        setOutline(prevOutline => {
          const updateItems = (items: OutlineItem[]): OutlineItem[] => {
            return items.map(item => {
              if (item.id === itemId) {
                return { ...item, text: newText, updatedAt: new Date().toISOString() };
              }
              if (item.children.length > 0) {
                return { ...item, children: updateItems(item.children) };
              }
              return item;
            });
          };
          const updated = updateItems(prevOutline);
          
          // REMOVED: onItemsChange - prefer surgical updates
          setTimeout(() => {
            resolve();
          }, 0);
          
          return updated;
        });
      });
    }
  };

  const indentItem = (itemId: string) => {
    // Implementation similar to mobile but with keyboard support
    const updateItems = (items: OutlineItem[]): OutlineItem[] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId && i > 0) {
          const [item] = items.splice(i, 1);
          item.parentId = items[i - 1].id;
          items[i - 1].children = [...items[i - 1].children, item];
          // Ensure parent is expanded
          items[i - 1].expanded = true;
          return [...items];
        }
        if (items[i].children.length > 0) {
          items[i].children = updateItems(items[i].children);
        }
      }
      return items;
    };

    let updated = updateItems([...outline]);
    // Recalculate all levels to ensure consistency
    updated = recalculateLevels(updated);
    setOutline(updated);
    // REMOVED: onItemsChange - now using surgical onMoveItem in Tab handler
  };

  const outdentItem = (itemId: string) => {
    // Implementation similar to mobile
    console.log('Outdent item:', itemId);
  };

  const handleKeyDown = async (e: React.KeyboardEvent, itemId: string) => {
    // Handle Enter key first (most common case)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const trimmedValue = textarea.value.trim();
      
      // If the text is empty, remove the item
      if (!trimmedValue || trimmedValue === '') {
        setEditingId(null);
        
        // Use surgical delete if available
        if (onDeleteItem) {
          await onDeleteItem(itemId);
          // Update local state to remove the item
          setOutline(prevOutline => {
            const removeItem = (items: OutlineItem[]): OutlineItem[] => {
              return items.filter(item => {
                if (item.id === itemId) return false;
                if (item.children.length > 0) {
                  item.children = removeItem(item.children);
                }
                return true;
              });
            };
            return removeItem(prevOutline);
          });
        }
        return;
      }
      
      // USE SURGICAL OPERATIONS for creating new item
      if (onUpdateItem && onCreateItem) {
        // First, update the current item's text surgically
        await updateItemText(itemId, trimmedValue);
        
        // Find where to insert the new item
        let parentId: string | null = null;
        let position = 0;
        let level = 0;
        
        const findItemPosition = (items: OutlineItem[], parent: string | null = null): boolean => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].id === itemId) {
              parentId = parent;
              position = i + 1;
              level = items[i].level;
              return true;
            }
            if (items[i].children.length > 0) {
              if (findItemPosition(items[i].children, items[i].id)) {
                return true;
              }
            }
          }
          return false;
        };
        
        findItemPosition(outline);
        
        // Create the new item surgically
        const newItemId = await onCreateItem(
          parentId,
          '', // Empty text for new item
          position,
          selectedStyle,
          selectedStyle === 'header' ? { bold: true, size: 'large' as const } : undefined
        );
        
        // Update local state to add the new item
        const newItem: OutlineItem = {
          id: newItemId,
          text: '',
          level: level,
          expanded: false,
          children: [],
          style: selectedStyle,
          formatting: selectedStyle === 'header' ? { bold: true, size: 'large' as const } : undefined
        };
        
        setOutline(prevOutline => {
          const insertAfter = (items: OutlineItem[]): OutlineItem[] => {
            const result = [...items];
            for (let i = 0; i < result.length; i++) {
              if (result[i].id === itemId) {
                result.splice(i + 1, 0, newItem);
                return result;
              }
              if (result[i].children.length > 0) {
                result[i].children = insertAfter(result[i].children);
              }
            }
            return result;
          };
          return insertAfter(prevOutline);
        });
        
        // Start editing the new item
        setTimeout(() => startEditing(newItemId), 50);
        
      } else {
        // FALLBACK: Old implementation if surgical handlers not available
        const updateAndCreateNew = () => {
          setOutline(prevOutline => {
            const updateItems = (items: OutlineItem[]): OutlineItem[] => {
              return items.map(item => {
                if (item.id === itemId) {
                  console.log(`Saving item ${itemId} with text: "${trimmedValue}" to outline ${currentOutlineId}`);
                  return { ...item, text: trimmedValue, updatedAt: new Date().toISOString() };
                }
                if (item.children.length > 0) {
                  return { ...item, children: updateItems(item.children) };
                }
                return item;
              });
            };
            const updated = updateItems(prevOutline);
            
            // Now add the new item after updating the current one
            const newItem: OutlineItem = {
              id: generateNewItemId(),
              text: '',
              level: 0,
              expanded: false,
              children: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              style: selectedStyle,
              formatting: selectedStyle === 'header' ? { bold: true, size: 'large' as const } : undefined
            };
            
            const insertAfter = (items: OutlineItem[]): OutlineItem[] => {
              for (let i = 0; i < items.length; i++) {
                if (items[i].id === itemId) {
                  newItem.level = items[i].level;
                  items.splice(i + 1, 0, newItem);
                  // Set the new item to be edited after a short delay
                  setTimeout(() => startEditing(newItem.id), 50);
                  return items;
                }
                if (items[i].children.length > 0) {
                  items[i].children = insertAfter(items[i].children);
                }
              }
              return items;
            };
            
            const finalUpdated = insertAfter(updated);
            // Removed onItemsChange call - should use surgical operations
            return finalUpdated;
          });
        
          // Stop editing the current item
          setEditingId(null);
        };
        
        updateAndCreateNew();
        
        // Handle backend sync for new items
        if (itemId.startsWith('item_') && currentOutlineId) {
          try {
            const { outlinesApi } = await import('@/services/api/apiClient');
            const created = await outlinesApi.createItem(currentOutlineId, {
              content: trimmedValue,
              parentId: null,
              style: selectedStyle,
              formatting: selectedStyle === 'header' ? { bold: true, size: 'large' } : undefined
            } as any);
            
            // Update the local item with the backend ID
            setOutline(prevOutline => {
              const updateId = (items: OutlineItem[]): OutlineItem[] => {
                return items.map(i => {
                  if (i.id === itemId) {
                    return { 
                      ...i, 
                      id: created.id,
                      text: created.content,
                      createdAt: created.createdAt,
                      updatedAt: created.updatedAt
                    };
                  }
                  if (i.children.length > 0) {
                    return { ...i, children: updateId(i.children) };
                  }
                  return i;
                });
              };
              return updateId(prevOutline);
            });
          } catch (error) {
            console.error('Failed to create item in backend:', error);
          }
        }
      }
      return;
    }
    
    // Handle Escape key
    if (e.key === 'Escape') {
      const textarea = e.target as HTMLTextAreaElement;
      const trimmedValue = textarea.value.trim();
      
      if (trimmedValue && trimmedValue !== '') {
        // Save the text before exiting using surgical update
        await updateItemText(itemId, trimmedValue);
      } else if (onDeleteItem) {
        // Use surgical delete for empty item
        await onDeleteItem(itemId);
        // Update local state
        setOutline(prevOutline => {
          const removeItem = (items: OutlineItem[]): OutlineItem[] => {
            return items.filter(item => {
              if (item.id === itemId) return false;
              if (item.children.length > 0) {
                item.children = removeItem(item.children);
              }
              return true;
            });
          };
          return removeItem(prevOutline);
        });
      } else {
        // Fallback to old method
        const removeEmptyItem = (items: OutlineItem[]): OutlineItem[] => {
          return items.filter(item => {
            if (item.id === itemId) {
              return false;
            }
            if (item.children.length > 0) {
              item.children = removeEmptyItem(item.children);
            }
            return true;
          });
        };
        const updated = removeEmptyItem(outline);
        setOutline(updated);
        // REMOVED: onItemsChange - prefer surgical delete
      }
      
      stopEditing();
      return;
    }
    
    // Handle Tab for indentation
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      
      // Use surgical move if available
      if (onMoveItem) {
        // Find the previous sibling to make it the new parent
        let previousItemId: string | null = null;
        
        const findPreviousSibling = (items: OutlineItem[]): boolean => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].id === itemId && i > 0) {
              previousItemId = items[i - 1].id;
              return true;
            }
            if (items[i].children && findPreviousSibling(items[i].children)) {
              return true;
            }
          }
          return false;
        };
        
        findPreviousSibling(outline);
        
        if (previousItemId) {
          // Move item to be a child of the previous sibling
          await onMoveItem(itemId, previousItemId, 0);
          
          // Update local state
          indentItem(itemId);
        }
      } else {
        // Fallback to old method
        // Find the item and its previous sibling
        let targetItem: OutlineItem | null = null;
        let previousItem: OutlineItem | null = null;
        let parentOfTarget: OutlineItem | null = null;
        
        const findItemAndPrevious = (items: OutlineItem[], parent: OutlineItem | null = null): boolean => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].id === itemId) {
              targetItem = items[i];
              parentOfTarget = parent;
              // Get the previous sibling at the same level
              if (i > 0) {
                previousItem = items[i - 1];
              }
              return true;
            }
            // Search in children
            if (items[i].children && items[i].children.length > 0) {
              if (findItemAndPrevious(items[i].children, items[i])) {
                return true;
              }
            }
          }
          return false;
        };
        
        findItemAndPrevious(outline);
        
        if (targetItem && previousItem) {
          // Remove target from its current position
          const removeFromParent = (items: OutlineItem[]): OutlineItem[] => {
            return items.filter(item => {
              if (item.id === itemId) {
                return false;
              }
              if (item.children && item.children.length > 0) {
                item.children = removeFromParent(item.children);
              }
              return true;
            });
          };
          
          // Add target as child of previous item
          const addAsChild = (items: OutlineItem[]): OutlineItem[] => {
            return items.map(item => {
              if (item.id === previousItem!.id) {
                if (!item.children) item.children = [];
                targetItem!.level = item.level + 1;
                targetItem!.parentId = item.id;
                item.children.push(targetItem!);
                item.expanded = true;
              } else if (item.children && item.children.length > 0) {
                item.children = addAsChild(item.children);
              }
              return item;
            });
          };
          
          let updated = removeFromParent([...outline]);
          updated = addAsChild(updated);
          // Recalculate all levels to ensure consistency
          updated = recalculateLevels(updated);
          setOutline(updated);
          // REMOVED: onItemsChange - prefer surgical move
          
          // Save the indent change to backend
          if (currentOutlineId && previousItem) {
            const saveIndent = async () => {
              try {
                const { outlinesApi } = await import('@/services/api/apiClient');
                // If item already exists in backend (not a newly created item), update its parentId
                // New items have format: item_1234567890123 (13 digits)
                // Backend items have format: item_1234567890123456_789 (more digits with suffix)
                const isNewItem = itemId.match(/^item_\d{13}$/);
                if (!isNewItem) {
                  await outlinesApi.updateItem(currentOutlineId, itemId, { 
                    parentId: previousItem.id 
                  });
                  console.log('Indented item saved with new parentId:', previousItem.id);
                }
              } catch (error) {
                console.error('Failed to save indent:', error);
              }
            };
            saveIndent();
          }
        }
      }
      return;
    }
    
    // Handle Shift+Tab for outdentation
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      
      // Use surgical move if available
      if (onMoveItem) {
        // Find the parent's parent to outdent to
        let currentParentId: string | null = null;
        let grandParentId: string | null = null;
        let positionAfterParent = 0;
        
        const findParents = (items: OutlineItem[], parent: string | null = null): boolean => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].id === itemId) {
              currentParentId = parent;
              return true;
            }
            if (items[i].children) {
              if (findParents(items[i].children, items[i].id)) {
                // If we found it in children, this item is the parent
                if (parent === null) {
                  // Parent is at root level
                  grandParentId = null;
                  positionAfterParent = i + 1;
                } else {
                  // Need to find grandparent
                  const findGrandParent = (searchItems: OutlineItem[]): boolean => {
                    for (let j = 0; j < searchItems.length; j++) {
                      if (searchItems[j].id === parent) {
                        grandParentId = null; // Parent is at root
                        positionAfterParent = j + 1;
                        return true;
                      }
                      if (searchItems[j].children) {
                        for (let k = 0; k < searchItems[j].children.length; k++) {
                          if (searchItems[j].children[k].id === parent) {
                            grandParentId = searchItems[j].id;
                            positionAfterParent = k + 1;
                            return true;
                          }
                        }
                      }
                    }
                    return false;
                  };
                  findGrandParent(outline);
                }
                return true;
              }
            }
          }
          return false;
        };
        
        findParents(outline);
        
        if (currentParentId) {
          // Can outdent - move to grandparent level
          await onMoveItem(itemId, grandParentId, positionAfterParent);
          
          // Update local state
          outdentItem(itemId);
        }
      } else {
        // Fallback to old method
        const outdentItem = (items: OutlineItem[], targetId: string, parent: OutlineItem | null = null): OutlineItem[] => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].id === targetId && parent) {
              // This is the item to outdent, and it has a parent
              return items; // Can't outdent top-level items
            }
            
            if (items[i].children.length > 0) {
              for (let j = 0; j < items[i].children.length; j++) {
                if (items[i].children[j].id === targetId) {
                  // Found the item in children - move it out
                  const [removed] = items[i].children.splice(j, 1);
                  removed.level = items[i].level;
                  removed.parentId = items[i].parentId;
                  // Insert after parent
                  const parentIndex = items.indexOf(items[i]);
                  items.splice(parentIndex + 1, 0, removed);
                  return items;
                }
              }
              items[i].children = outdentItem(items[i].children, targetId, items[i]);
            }
          }
          return items;
        };
        let updated = outdentItem([...outline], itemId);
        // Recalculate all levels to ensure consistency
        updated = recalculateLevels(updated);
        setOutline(updated);
        // REMOVED: onItemsChange - prefer surgical move
      }
      return;
    }
    
    // Handle Cmd/Ctrl+B for bold/header style
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      
      // Find current style
      let currentStyle: OutlineItem['style'] = 'normal';
      const findItemStyle = (items: OutlineItem[]): boolean => {
        for (const item of items) {
          if (item.id === itemId) {
            currentStyle = item.style || 'normal';
            return true;
          }
          if (item.children && findItemStyle(item.children)) return true;
        }
        return false;
      };
      findItemStyle(outline);
      
      const newStyle = currentStyle === 'header' ? 'normal' : 'header';
      const newFormatting = newStyle === 'header' ? { bold: true, size: 'large' as const } : undefined;
      
      // Use surgical update if available
      if (onUpdateItem) {
        await onUpdateItem(itemId, { style: newStyle, formatting: newFormatting });
      }
      
      // Update local state
      const updateStyle = (items: OutlineItem[]): OutlineItem[] => {
        return items.map(item => {
          if (item.id === itemId) {
            return { ...item, style: newStyle, formatting: newFormatting };
          }
          if (item.children.length > 0) {
            return { ...item, children: updateStyle(item.children) };
          }
          return item;
        });
      };
      setOutline(updateStyle(outline));
      
      // Also update selectedStyle for this editing session
      setSelectedStyle(newStyle);
      return;
    }
    
    // Handle Cmd/Ctrl+I for italic/quote style
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      
      // Find current style
      let currentStyle: OutlineItem['style'] = 'normal';
      const findItemStyle = (items: OutlineItem[]): boolean => {
        for (const item of items) {
          if (item.id === itemId) {
            currentStyle = item.style || 'normal';
            return true;
          }
          if (item.children && findItemStyle(item.children)) return true;
        }
        return false;
      };
      findItemStyle(outline);
      
      const newStyle = currentStyle === 'quote' ? 'normal' : 'quote';
      const newFormatting = newStyle === 'quote' ? { italic: true } : undefined;
      
      // Use surgical update if available
      if (onUpdateItem) {
        await onUpdateItem(itemId, { style: newStyle, formatting: newFormatting });
      }
      
      // Update local state
      const updateStyle = (items: OutlineItem[]): OutlineItem[] => {
        return items.map(item => {
          if (item.id === itemId) {
            return { ...item, style: newStyle, formatting: newFormatting };
          }
          if (item.children.length > 0) {
            return { ...item, children: updateStyle(item.children) };
          }
          return item;
        });
      };
      setOutline(updateStyle(outline));
      
      // Also update selectedStyle for this editing session
      setSelectedStyle(newStyle);
      return;
    }
    
    // Handle Cmd/Ctrl+E for code style
    if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
      e.preventDefault();
      
      // Find current style
      let currentStyle: OutlineItem['style'] = 'normal';
      const findItemStyle = (items: OutlineItem[]): boolean => {
        for (const item of items) {
          if (item.id === itemId) {
            currentStyle = item.style || 'normal';
            return true;
          }
          if (item.children && findItemStyle(item.children)) return true;
        }
        return false;
      };
      findItemStyle(outline);
      
      const newStyle = currentStyle === 'code' ? 'normal' : 'code';
      const newFormatting = newStyle === 'code' ? { monospace: true } : undefined;
      
      // Use surgical update if available
      if (onUpdateItem) {
        await onUpdateItem(itemId, { style: newStyle, formatting: newFormatting });
      }
      
      // Update local state
      const updateStyle = (items: OutlineItem[]): OutlineItem[] => {
        return items.map(item => {
          if (item.id === itemId) {
            return { ...item, style: newStyle, formatting: newFormatting };
          }
          if (item.children.length > 0) {
            return { ...item, children: updateStyle(item.children) };
          }
          return item;
        });
      };
      setOutline(updateStyle(outline));
      
      // Also update selectedStyle for this editing session
      setSelectedStyle(newStyle);
      return;
    }
  };

  const handleItemClick = (e: React.MouseEvent, itemId: string) => {
    if (e.ctrlKey || e.metaKey) {
      // Multi-select with Ctrl/Cmd
      const newSelected = new Set(selectedItems);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      setSelectedItems(newSelected);
    } else {
      // Single select and edit
      setSelectedItems(new Set());
      startEditing(itemId);
    }
  };

  const addNewItem = (style?: 'header' | 'code' | 'quote' | 'normal') => {
    const newItem: OutlineItem = {
      id: generateNewItemId(),
      text: '',
      level: 0,
      expanded: false,
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      style: style || selectedStyle,
      formatting: (style || selectedStyle) === 'header' ? { bold: true, size: 'large' as const } : 
                 (style || selectedStyle) === 'quote' ? { italic: true, size: 'medium' as const } :
                 undefined
    };
    const updated = [...outline, newItem];
    setOutline(updated);
    // Removed onItemsChange call - should use surgical operations
    startEditing(newItem.id);
  };

  // Helper function to determine parent ID from section
  const determineParentFromSection = (section?: string, targetSection?: string): string | null => {
    const sectionToCheck = targetSection || section;
    if (!sectionToCheck) return null;
    
    // Find the most specific matching section (deepest in the hierarchy)
    let bestMatch: { id: string; depth: number } | null = null;
    
    const findSectionParent = (items: OutlineItem[], depth: number = 0): void => {
      for (const item of items) {
        const itemTextLower = item.text.toLowerCase();
        const sectionLower = sectionToCheck.toLowerCase();
        
        let isMatch = false;
        
        // Check for DOK levels (DOK1, DOK2, DOK3, DOK4, etc.)
        if (sectionLower.includes('dok') || sectionLower.includes('depth of knowledge')) {
          // Extract the level number if present
          const levelMatch = sectionLower.match(/dok\s*(?:level\s*)?(\d+)|depth of knowledge\s*(?:level\s*)?(\d+)/);
          if (levelMatch) {
            const level = levelMatch[1] || levelMatch[2];
            if (itemTextLower.includes(`dok${level}`) || 
                itemTextLower.includes(`dok ${level}`) || 
                itemTextLower.includes(`dok level ${level}`) ||
                itemTextLower.includes(`depth of knowledge ${level}`) ||
                itemTextLower.includes(`dok-${level}`) ||
                itemTextLower.includes(`depth of knowledge level ${level}`)) {
              isMatch = true;
            }
          }
          // Also handle simple format like "dok3"
          else if (sectionLower.match(/^dok\d+$/)) {
            const level = sectionLower.replace('dok', '');
            if (itemTextLower.includes(`dok${level}`) || 
                itemTextLower.includes(`dok ${level}`) || 
                itemTextLower.includes(`dok level ${level}`) ||
                itemTextLower.includes(`depth of knowledge ${level}`)) {
              isMatch = true;
            }
          }
          // Generic DOK match if no specific level
          else if (itemTextLower.includes('dok') || itemTextLower.includes('depth of knowledge')) {
            isMatch = true;
          }
        }
        
        // For "out of scope" - prioritize exact match
        if (sectionLower.includes('out') && sectionLower.includes('scope') && 
            itemTextLower.includes('out') && itemTextLower.includes('scope')) {
          isMatch = true;
        }
        // Check for exact or partial section name match
        else if (itemTextLower.includes(sectionLower)) {
          isMatch = true;
        }
        // Specific section aliases
        else if (sectionToCheck === 'spov' && (itemTextLower.includes('spov') || itemTextLower.includes('strategic point') || itemTextLower.includes('spiky pov'))) {
          isMatch = true;
        }
        else if (sectionToCheck === 'purpose' && itemTextLower.includes('purpose')) {
          isMatch = true;
        }
        else if (sectionToCheck === 'owner' && itemTextLower.includes('owner')) {
          isMatch = true;
        }
        else if (sectionToCheck === 'scope' && itemTextLower.includes('scope') && !itemTextLower.includes('out')) {
          isMatch = true;
        }
        else if ((sectionToCheck === 'initiative_overview' || sectionToCheck === 'overview') && itemTextLower.includes('overview')) {
          isMatch = true;
        }
        else if (sectionLower.includes('context') && itemTextLower.includes('context')) {
          isMatch = true;
        }
        else if (sectionLower.includes('insight') && itemTextLower.includes('insight')) {
          isMatch = true;
        }
        
        // If we found a match, update bestMatch if this is deeper
        if (isMatch) {
          if (!bestMatch || depth > bestMatch.depth) {
            bestMatch = { id: item.id, depth };
          }
        }
        
        // Check children recursively
        if (item.children && item.children.length > 0) {
          findSectionParent(item.children, depth + 1);
        }
      }
    };
    
    findSectionParent(outline, 0);
    return bestMatch ? bestMatch.id : null;
  };

  const handleLLMAction = async (action: LLMAction, response: LLMResponse) => {
    // Use surgical handlers if available
    if (onLLMEditItem && onLLMCreateItems) {
      if (action.type === 'edit' && action.targetId) {
        // EDIT existing item using surgical handler
        if (response.content && !response.items) {
          // Simple text edit - no structural changes
          await onLLMEditItem(action.targetId, response.content);
        } else if (response.items && response.items.length > 0) {
          // Structural edit - item with new children
          await onLLMEditItem(
            action.targetId,
            response.items[0].text,
            response.items[0].children
          );
        }
        
        // Update local state to reflect changes
        if (response.content) {
          setOutline(prevOutline => {
            const updateItem = (items: OutlineItem[]): OutlineItem[] => {
              return items.map(item => {
                if (item.id === action.targetId) {
                  return { ...item, text: response.content! };
                }
                if (item.children) {
                  return { ...item, children: updateItem(item.children) };
                }
                return item;
              });
            };
            return updateItem(prevOutline);
          });
        }
        
      } else if (action.type === 'create' && response.items) {
        // CREATE new items using surgical handler
        const parentId = action.parentId || determineParentFromSection(action.section, response.items[0]?.targetSection);
        await onLLMCreateItems(parentId, response.items);
        
      } else if (action.type === 'research') {
        // RESEARCH - might create or edit based on findings
        if (response.content && action.targetId) {
          await onLLMEditItem(action.targetId, response.content);
        } else if (response.items) {
          const parentId = action.parentId || null;
          await onLLMCreateItems(parentId, response.items);
        }
      }
      
      return; // Exit early when using surgical handlers
    }
    
    // ========= FALLBACK: Old implementation if surgical handlers not available =========
    
    if (action.type === 'edit' && action.targetId) {
      // Edit existing item - handle both simple content and structured items
      if (response.content) {
        // Simple text replacement - preserve existing children
        const updateItem = (items: OutlineItem[]): OutlineItem[] => {
          return items.map(item => {
            if (item.id === action.targetId) {
              // Keep all existing properties including children, just update text
              return { ...item, text: response.content! };
            }
            if (item.children) {
              return { ...item, children: updateItem(item.children) };
            }
            return item;
          });
        };
        
        const updatedOutline = updateItem(outline);
        setOutline(updatedOutline);
        if (onItemsChange) onItemsChange(updatedOutline);
        
      } else if (response.items && response.items.length > 0) {
        // Structured replacement - AI provided new nested structure
        const responseItem = response.items[0];
        
        const updateItem = (items: OutlineItem[]): OutlineItem[] => {
          return items.map(item => {
            if (item.id === action.targetId) {
              // Preserve item ID and metadata, but update content and children
              const updatedItem = { ...item, text: responseItem.text };
              
              // If AI provided new children structure, use it
              if (responseItem.children && responseItem.children.length > 0) {
                updatedItem.children = responseItem.children.map((child: any, idx: number) => {
                  const createChild = (childData: any, level: number = item.level + 1): OutlineItem => ({
                    id: generateNewItemId(),
                    text: childData.text,
                    level,
                    expanded: true,
                    parentId: item.id,
                    children: childData.children ? 
                      childData.children.map((subChild: any, subIdx: number) => 
                        createChild(subChild, level + 1)) : [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                  return createChild(child);
                });
              }
              
              return updatedItem;
            }
            if (item.children) {
              return { ...item, children: updateItem(item.children) };
            }
            return item;
          });
        };
        
        const updatedOutline = updateItem(outline);
        setOutline(updatedOutline);
        if (onItemsChange) onItemsChange(updatedOutline);
      }
      
      // Save to backend if we have a real item ID (backend IDs start with 'item_')
      if (currentOutlineId && action.targetId && action.targetId.startsWith('item_')) {
        try {
          if (response.content) {
            // Simple text update
            await outlinesApi.updateItem(currentOutlineId, action.targetId, { 
              content: response.content 
            });
          } else if (response.items && response.items.length > 0) {
            // Structured update - need to update main item and potentially add new children
            const responseItem = response.items[0];
            
            // Update the main item's text
            await outlinesApi.updateItem(currentOutlineId, action.targetId, { 
              content: responseItem.text 
            });
            
            // If there are new children from AI, save them too
            if (responseItem.children && responseItem.children.length > 0) {
              const saveChildRecursively = async (child: any, parentId: string) => {
                const created = await outlinesApi.createItem(currentOutlineId, {
                  content: child.text,
                  parentId: parentId,
                  order: 0
                });
                
                if (child.children) {
                  for (const subChild of child.children) {
                    await saveChildRecursively(subChild, created.id);
                  }
                }
              };
              
              // Save all new children
              for (const child of responseItem.children) {
                await saveChildRecursively(child, action.targetId);
              }
            }
            
          }
        } catch (error) {
          console.error('Failed to save edit to backend:', error);
        }
      }
      
    } else if (action.type === 'create' && response.items) {
      // Determine the correct parent based on section
      let targetParentId = action.parentId;
      
      // Check if the response includes a targetSection hint from the LLM
      const targetSection = response.items[0]?.targetSection || action.section;
      
      // If we have a section but no parentId, find the appropriate parent
      if (targetSection && !action.parentId) {
        const findSectionParent = (items: OutlineItem[]): string | null => {
          for (const item of items) {
            const itemTextLower = item.text.toLowerCase();
            
            // Match section headers based on targetSection from LLM
            if (targetSection === 'spov' && (itemTextLower.includes('spov') || itemTextLower.includes('strategic point'))) {
              return item.id;
            }
            if (targetSection === 'purpose' && itemTextLower.includes('purpose')) {
              return item.id;
            }
            if (targetSection === 'owner' && itemTextLower.includes('owner')) {
              return item.id;
            }
            if ((targetSection === 'out_of_scope' || targetSection === 'scope') && itemTextLower.includes('scope')) {
              return item.id;
            }
            if ((targetSection === 'initiative_overview' || targetSection === 'overview') && itemTextLower.includes('overview')) {
              return item.id;
            }
            if (targetSection === 'expert_council' && (itemTextLower.includes('expert') || itemTextLower.includes('council') || itemTextLower.includes('advisor'))) {
              return item.id;
            }
            if (targetSection === 'dok1' && (itemTextLower.includes('dok') && itemTextLower.includes('1')) || 
                (itemTextLower.includes('evidence') || itemTextLower.includes('fact') || itemTextLower.includes('citation'))) {
              return item.id;
            }
            if (targetSection === 'dok2' && (itemTextLower.includes('dok') && itemTextLower.includes('2')) || 
                itemTextLower.includes('knowledge')) {
              return item.id;
            }
            if (targetSection === 'dok3' && (itemTextLower.includes('dok') && itemTextLower.includes('3')) || 
                itemTextLower.includes('insight')) {
              return item.id;
            }
            
            // Recursively search children
            if (item.children && item.children.length > 0) {
              const found = findSectionParent(item.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        targetParentId = findSectionParent(outline);
        
        // Log for debugging
        if (targetParentId) {
          console.log(`Found parent for section ${targetSection}: ${targetParentId}`);
        } else {
          console.log(`No parent found for section ${targetSection}, will add at root level`);
        }
      }
      
      // Save new items to backend FIRST to get real IDs
      if (currentOutlineId && response.items) {
        try {
          const savedItems: OutlineItem[] = [];
          
          const saveItemRecursively = async (item: any, parentId: string | null = null, level: number = 0): Promise<OutlineItem | null> => {
            try {
              // Calculate the correct order - count existing siblings with same parent
              const countSiblings = (items: OutlineItem[], targetParentId: string | null): number => {
                let count = 0;
                const traverse = (items: OutlineItem[]) => {
                  for (const item of items) {
                    if (item.parentId === targetParentId) {
                      count++;
                    }
                    if (item.children && item.children.length > 0) {
                      traverse(item.children);
                    }
                  }
                };
                
                if (targetParentId === null) {
                  // Count root level items
                  return items.filter(item => !item.parentId).length;
                } else {
                  // Find the parent and count its children
                  const findParent = (items: OutlineItem[]): OutlineItem | null => {
                    for (const item of items) {
                      if (item.id === targetParentId) {
                        return item;
                      }
                      if (item.children) {
                        const found = findParent(item.children);
                        if (found) return found;
                      }
                    }
                    return null;
                  };
                  
                  const parent = findParent(outline);
                  return parent ? (parent.children?.length || 0) : 0;
                }
              };
              
              const order = countSiblings(outline, parentId);
              
              // Create the item in backend
              const created = await outlinesApi.createItem(currentOutlineId, {
                content: item.text || item.content,
                parentId: parentId,
                order: order,
                style: item.style,
                formatting: item.formatting
              });
              
              // Create the OutlineItem with the real backend ID
              const outlineItem: OutlineItem = {
                id: created.id,  // Use real backend ID
                text: item.text || item.content,
                level,
                expanded: true,
                parentId,
                children: [],
                createdAt: created.createdAt,
                updatedAt: created.updatedAt
              };
              
              // Save children recursively
              if (item.children && item.children.length > 0) {
                for (const child of item.children) {
                  const savedChild = await saveItemRecursively(child, created.id, level + 1);
                  if (savedChild) {
                    outlineItem.children.push(savedChild);
                  }
                }
              }
              
              return outlineItem;
            } catch (error) {
              console.error('Failed to save item to backend:', error);
              return null;
            }
          };
          
          // Save all new items and collect them with real IDs
          for (const respItem of response.items) {
            const savedItem = await saveItemRecursively(respItem, targetParentId || null);
            if (savedItem) {
              savedItems.push(savedItem);
            }
          }
          
          // Now update the UI with items that have real backend IDs
          if (savedItems.length > 0) {
            if (targetParentId) {
              // Insert as children of specific parent
              const insertIntoParent = (items: OutlineItem[]): OutlineItem[] => {
                return items.map(item => {
                  if (item.id === targetParentId) {
                    return {
                      ...item,
                      children: [...(item.children || []), ...savedItems]
                    };
                  }
                  if (item.children) {
                    return { ...item, children: insertIntoParent(item.children) };
                  }
                  return item;
                });
              };
              
              const updatedOutline = insertIntoParent(outline);
              setOutline(updatedOutline);
              if (onItemsChange) onItemsChange(updatedOutline);
            } else {
              // Add to root level
              const updatedOutline = [...outline, ...savedItems];
              setOutline(updatedOutline);
              if (onItemsChange) onItemsChange(updatedOutline);
            }
          }
        } catch (error) {
          console.error('Failed to save AI-generated items:', error);
        }
      }
    }
  };
  
  const openLLMAssistantForItem = (item: OutlineItem) => {
    setLLMCurrentItem(item);
    setLLMCurrentSection(detectSectionFromItem(item));
    setLLMInitialPrompt('');
    setShowLLMAssistant(true);
  };
  
  const openLLMAssistantForCreate = (parentId?: string, section?: string) => {
    setLLMCurrentItem(null);
    setLLMCurrentSection(section);
    setLLMInitialPrompt('');
    setShowLLMAssistant(true);
  };
  
  const handleVoiceToAI = (transcription: string) => {
    // Open AI Assistant in create mode with the transcription as the initial prompt
    setLLMCurrentItem(null);
    setLLMCurrentSection(undefined);
    setLLMInitialPrompt(transcription);
    setShowVoiceModal(false);
    setShowLLMAssistant(true);
  };
  
  const detectSectionFromItem = (item: OutlineItem): string | undefined => {
    const text = item.text.toLowerCase();
    if (text.includes('spov')) return 'spov';
    if (text.includes('purpose')) return 'purpose';
    if (text.includes('owner')) return 'owner';
    if (text.includes('scope')) return 'out_of_scope';
    if (text.includes('overview')) return 'initiative_overview';
    if (text.includes('dok')) return text.includes('3') ? 'dok3' : text.includes('2') ? 'dok2' : 'dok1';
    if (text.includes('expert') || text.includes('council')) return 'expert_council';
    return undefined;
  };

  const applyBrainliftTemplate = async () => {
    // Confirm if there are existing items
    if (outline.length > 0) {
      const confirmed = window.confirm(
        'This will replace your current outline with the Brainlift template. Are you sure?'
      );
      if (!confirmed) return;
    }
    
    // Make sure we have an outline ID first
    if (!currentOutlineId) {
      console.error('No outline ID available, cannot save template');
      return;
    }
    
    // Apply the template
    const templateItems = createBrainliftTemplate();
    
    // Use surgical template application if available
    if (onApplyTemplate) {
      await onApplyTemplate(templateItems);
      setOutline(templateItems);
    } else {
      // Fallback: Just update the state and let onItemsChange handle the backend sync
      setOutline(templateItems);
      if (onItemsChange) {
        setTimeout(() => {
          onItemsChange(templateItems);
        }, 0);
      }
    }
  };
  
  // Helper function to recursively create items with children
  const createItemWithChildren = async (
    item: OutlineItem, 
    parentId: string | null,
    api: any,
    outlineId: string
  ): Promise<string> => {
    // Create the item
    const created = await api.createItem(outlineId, {
      content: item.text,
      parentId: parentId,
      style: item.style,
      formatting: item.formatting
    });
    
    // Create children recursively
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        await createItemWithChildren(child, created.id, api, outlineId);
      }
    }
    
    return created.id;
  };

  const toggleItemStyle = async (itemId: string, style: 'header' | 'code' | 'quote' | 'normal') => {
    const formatting = style === 'header' ? { bold: true, size: 'large' as const } : 
                      style === 'code' ? { size: 'medium' as const } :
                      style === 'quote' ? { italic: true, size: 'medium' as const } :
                      undefined;
    
    // Use surgical update if available
    if (onUpdateItem) {
      await onUpdateItem(itemId, { style, formatting });
      // Update local state
      const updateItems = (items: OutlineItem[]): OutlineItem[] => {
        return items.map(item => {
          if (item.id === itemId) {
            return { ...item, style, formatting };
          }
          if (item.children.length > 0) {
            return { ...item, children: updateItems(item.children) };
          }
          return item;
        });
      };
      setOutline(updateItems(outline));
    } else {
      // Fallback removed - must use surgical operations
    }
    
    // Save style change to backend if item exists there
    if (currentOutlineId && !itemId.startsWith('item_')) {
      try {
        const { outlinesApi } = await import('@/services/api/apiClient');
        // Find the item to get its current text
        const findItem = (items: OutlineItem[]): OutlineItem | null => {
          for (const item of items) {
            if (item.id === itemId) return item;
            if (item.children.length > 0) {
              const found = findItem(item.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        const item = findItem(outline);
        if (item && item.text) {
          await outlinesApi.updateItem(currentOutlineId, itemId, { 
            content: item.text,
            style: style,
            ...(style === 'header' ? { formatting: { bold: true, size: 'large' } } :
                style === 'code' ? { formatting: { size: 'medium' } } :
                style === 'quote' ? { formatting: { italic: true, size: 'medium' } } :
                {})
          } as any);
        }
      } catch (error) {
        console.error('Failed to save style change:', error);
      }
    }
  };

  const handleAcceptStructure = async (items: OutlineItem[]) => {
    // Save structured items to backend and add to outline
    if (currentOutlineId) {
      try {
        const savedItems: OutlineItem[] = [];
        
        // Helper to save items recursively with proper order
        const saveItemRecursively = async (item: OutlineItem, parentId: string | null = null): Promise<OutlineItem | null> => {
          try {
            // Calculate the correct order - count existing siblings
            const countSiblings = (items: OutlineItem[], targetParentId: string | null): number => {
              if (targetParentId === null) {
                // Count root level items
                return items.filter(i => !i.parentId).length;
              } else {
                // Find parent and count its children
                const findParent = (items: OutlineItem[]): OutlineItem | null => {
                  for (const i of items) {
                    if (i.id === targetParentId) return i;
                    if (i.children) {
                      const found = findParent(i.children);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const parent = findParent(outline);
                return parent ? (parent.children?.length || 0) : 0;
              }
            };
            
            const order = countSiblings(outline, parentId);
            
            // Create the item in backend
            const created = await outlinesApi.createItem(currentOutlineId, {
              content: item.text,
              parentId: parentId,
              order: order,
              style: item.style,
              formatting: item.formatting
            });
            
            // Create the OutlineItem with the real backend ID
            const outlineItem: OutlineItem = {
              ...item,
              id: created.id,  // Use real backend ID
              parentId: parentId,
              createdAt: created.createdAt,
              updatedAt: created.updatedAt
            };
            
            // Save children recursively
            if (item.children && item.children.length > 0) {
              outlineItem.children = [];
              for (const child of item.children) {
                const savedChild = await saveItemRecursively(child, created.id);
                if (savedChild) {
                  outlineItem.children.push(savedChild);
                }
              }
            }
            
            return outlineItem;
          } catch (error) {
            console.error('Failed to save voice item to backend:', error);
            return null;
          }
        };
        
        // Save all items and collect them with real IDs
        for (const item of items) {
          const savedItem = await saveItemRecursively(item, null);
          if (savedItem) {
            savedItems.push(savedItem);
          }
        }
        
        // Update UI with items that have real backend IDs
        if (savedItems.length > 0) {
          const updated = [...outline, ...savedItems];
          setOutline(updated);
          // Removed onItemsChange - should use handleApplyTemplate
        }
      } catch (error) {
        console.error('Failed to save voice structure:', error);
        // Fallback: just update locally if backend fails
        const updated = [...outline, ...items];
        setOutline(updated);
        // Removed onItemsChange - should use handleApplyTemplate
      }
    } else {
      // No outline ID, just update locally
      const updated = [...outline, ...items];
      setOutline(updated);
      // Removed onItemsChange - should use handleApplyTemplate
    }
  };

  const addNewItemAfter = (afterId: string) => {
    // Add a new item after the specified item at the same level
    const newItem: OutlineItem = {
      id: generateNewItemId(),
      text: '',
      level: 0,
      expanded: false,
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      style: selectedStyle,
      formatting: selectedStyle === 'header' ? { bold: true, size: 'large' as const } : undefined
    };

    const insertAfter = (items: OutlineItem[]): OutlineItem[] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === afterId) {
          newItem.level = items[i].level;
          items.splice(i + 1, 0, newItem);
          return items;
        }
        if (items[i].children.length > 0) {
          items[i].children = insertAfter(items[i].children);
        }
      }
      return items;
    };

    const updated = insertAfter([...outline]);
    setOutline(updated);
    // Removed onItemsChange - should use handleCreateItem
    setTimeout(() => startEditing(newItem.id), 0);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed position */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              {!sidebarCollapsed && (
                <span className="text-lg font-bold text-gray-900">BrainFlowy</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation - Scrollable if needed */}
        <div className="p-2 flex-1 overflow-y-auto">
          {sidebarCollapsed ? (
            <button 
              onClick={() => setSidebarCollapsed(false)}
              className="w-full p-2 rounded hover:bg-gray-100 flex justify-center"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          ) : (
            <>
              {/* User's Outlines */}
              <div className="mb-2 px-3 py-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Outlines</div>
              </div>
              {userOutlines.map((outline) => (
                <button
                  key={outline.id}
                  onClick={() => selectOutline(outline.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentOutlineId === outline.id 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  <span className="text-sm font-medium">{outline.title}</span>
                </button>
              ))}
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowNewOutlineDialog(true)}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Outline</span>
                </button>
              </div>
              
              {/* New Outline Dialog */}
              {showNewOutlineDialog && (
                <div className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 m-4 z-50">
                  <h3 className="text-sm font-semibold mb-2">Create New Outline</h3>
                  <input
                    type="text"
                    placeholder="Outline name"
                    value={newOutlineName}
                    onChange={(e) => setNewOutlineName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleNewOutlineSubmit();
                      } else if (e.key === 'Escape') {
                        setShowNewOutlineDialog(false);
                        setNewOutlineName('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => {
                        setShowNewOutlineDialog(false);
                        setNewOutlineName('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNewOutlineSubmit}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar - Fixed at top */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveTitle();
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setTempTitle(outlineTitle);
                    }
                  }}
                  className="text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none px-1"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => {
                    setIsEditingTitle(true);
                    setTempTitle(outlineTitle);
                  }}
                  title="Click to edit title"
                >
                  {outlineTitle}
                </h1>
              )}
              <div className="text-sm text-gray-500">
                <span>Last edited 2 hours ago</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search outline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 ${searchQuery ? 'pr-20' : 'pr-4'} py-2 text-gray-900 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {searchQuery && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <span className="text-xs text-gray-500">
                      {searchResultCount} {searchResultCount === 1 ? 'result' : 'results'}
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Clear search"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowVoiceModal(true)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showVoiceModal 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{showVoiceModal ? 'Stop Voice' : 'Voice Mode'}</span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div 
                    className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-xl border border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Style Selector and Keyboard Shortcuts */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedStyle('normal');
                  if (editingId) toggleItemStyle(editingId, 'normal');
                }}
                className={`px-2 py-1 rounded text-xs ${
                  selectedStyle === 'normal' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Normal
              </button>
              <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedStyle('header');
                  if (editingId) toggleItemStyle(editingId, 'header');
                }}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  selectedStyle === 'header' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Header
              </button>
              <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedStyle('code');
                  if (editingId) toggleItemStyle(editingId, 'code');
                }}
                className={`px-2 py-1 rounded text-xs font-mono ${
                  selectedStyle === 'code' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Code
              </button>
              <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedStyle('quote');
                  if (editingId) toggleItemStyle(editingId, 'quote');
                }}
                className={`px-2 py-1 rounded text-xs italic ${
                  selectedStyle === 'quote' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Quote
              </button>
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span><kbd className="px-1 bg-gray-100 rounded">Tab</kbd> indent</span>
              <span><kbd className="px-1 bg-gray-100 rounded">⌘B</kbd> header</span>
              <span><kbd className="px-1 bg-gray-100 rounded">⌘E</kbd> code</span>
              <span><kbd className="px-1 bg-gray-100 rounded">⌘I</kbd> quote</span>
            </div>
          </div>
        </div>


        {/* Outline Content - Only this area scrolls */}
        <div className="flex-1 overflow-y-auto outline-desktop-container">
          <div className="px-6 py-6">
            <div className="max-w-4xl outline-desktop-content">
            <div className="space-y-1">
              {filteredItems.map((item) => {
                const isMatch = searchQuery && matchingIds.has(item.id);
                const isParentContext = searchQuery && !matchingIds.has(item.id);
                
                return (
                <div
                  key={item.id}
                  className={`group rounded hover:bg-gray-50 transition-colors ${
                    selectedItems.has(item.id) ? 'bg-blue-50 border border-blue-200' : ''
                  } ${isMatch ? 'bg-yellow-50' : ''} ${isParentContext ? 'opacity-60' : ''}`}
                  style={{ paddingLeft: `${item.level * 24 + 8}px` }}
                >
                  <div className="flex items-start space-x-2 py-1">
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      {item.children.length > 0 ? (
                        item.expanded ? (
                          <ChevronDown className="w-3 h-3 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-gray-500" />
                        )
                      ) : (
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      )}
                    </button>

                    <div className="flex-1 min-w-0 flex items-start">
                      {editingId === item.id ? (
                        <textarea
                          ref={(el) => {
                            textAreaRefs.current[item.id] = el;
                          }}
                          defaultValue={item.text}
                          onBlur={async (e) => {
                            const value = e.target.value.trim();
                            console.log('onBlur - value:', value, 'item.text:', item.text, 'item.id:', item.id);
                            // If the field is empty or still "New item", remove the item
                            if (!value || value === 'New item') {
                              // Use surgical delete if available
                              if (onDeleteItem) {
                                await onDeleteItem(item.id);
                                // Update local state
                                setOutline(prevOutline => {
                                  const removeItem = (items: OutlineItem[]): OutlineItem[] => {
                                    return items.filter(i => {
                                      if (i.id === item.id) return false;
                                      if (i.children.length > 0) {
                                        i.children = removeItem(i.children);
                                      }
                                      return true;
                                    });
                                  };
                                  return removeItem(prevOutline);
                                });
                              } else {
                                // Fallback to old method
                                const removeEmptyItem = (items: OutlineItem[]): OutlineItem[] => {
                                  return items.filter(i => {
                                    if (i.id === item.id) {
                                      return false;
                                    }
                                    if (i.children.length > 0) {
                                      i.children = removeEmptyItem(i.children);
                                    }
                                    return true;
                                  });
                                };
                                const updated = removeEmptyItem(outline);
                                setOutline(updated);
                                // Removed onItemsChange - should use handleDeleteItem
                              }
                            } else if (value !== item.text) {
                              // Update the text if it changed - this already uses surgical update
                              await updateItemText(item.id, value);
                            }
                            stopEditing();
                          }}
                          onKeyDown={(e) => handleKeyDown(e, item.id)}
                          className="w-full px-2 py-1 text-sm text-gray-900 leading-relaxed bg-white border border-blue-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={item.style === 'code' ? 5 : 1}
                          placeholder=""
                        />
                      ) : (
                        <>
                          <div
                            onClick={(e) => handleItemClick(e, item.id)}
                            className={`flex-1 px-2 py-1 leading-relaxed cursor-text rounded hover:bg-gray-100 transition-colors ${
                              item.style === 'header' ? 'text-base font-bold text-gray-900' :
                              item.style === 'code' ? 'font-mono text-xs bg-gray-100 text-gray-800' :
                              item.style === 'quote' ? 'italic text-sm text-gray-700 border-l-4 border-gray-400 pl-3' :
                              'text-sm text-gray-900'
                            }`}
                          >
                            {highlightSearchTerm(item.text)}
                          </div>
                          
                          {/* Inline AI Assistant button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLLMAssistantForItem(item);
                            }}
                            className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-purple-100 rounded transition-all duration-200"
                            title="Edit with AI"
                          >
                            <Sparkles className="w-4 h-4 text-purple-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-2">
              <button 
                onClick={() => addNewItem()}
                className="w-full flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add new item</span>
              </button>
              
              <button 
                onClick={applyBrainliftTemplate}
                className="w-full flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Create Brainlift</span>
              </button>
              
              <button 
                onClick={() => {
                  setLLMCurrentItem(null);
                  setLLMCurrentSection(undefined);
                  setShowLLMAssistant(true);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI Assistant</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Modal */}
      <VoiceModal 
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onAcceptStructure={handleAcceptStructure}
        onSendToAI={handleVoiceToAI}
      />
      
      {/* LLM Assistant Panel with click-outside overlay */}
      {showLLMAssistant && (
        <>
          {/* Invisible overlay to capture outside clicks */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowLLMAssistant(false);
              setLLMCurrentItem(null);
              setLLMCurrentSection(undefined);
              setLLMInitialPrompt('');
            }}
          />
          <LLMAssistantPanel
            isOpen={showLLMAssistant}
            onClose={() => {
              setShowLLMAssistant(false);
              setLLMCurrentItem(null);
              setLLMCurrentSection(undefined);
              setLLMInitialPrompt('');
            }}
            currentItem={llmCurrentItem}
            currentSection={llmCurrentSection}
            initialPrompt={llmInitialPrompt}
            onApplyAction={handleLLMAction}
          />
        </>
      )}
    </div>
  );
};

export default OutlineDesktop;