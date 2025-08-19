import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Mic, Search, ChevronRight, ChevronDown, ChevronLeft, 
  Folder, Settings, HelpCircle, MoreHorizontal 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { OutlineItem } from '@/types/outline';
import VoiceModal from './VoiceModal';
import '../styles/outline.css';

interface OutlineDesktopProps {
  title?: string;
  initialItems?: OutlineItem[];
  onItemsChange?: (items: OutlineItem[]) => void;
  sidebarItems?: Array<{
    id: string;
    name: string;
    icon: React.ElementType;
    active: boolean;
  }>;
}

const OutlineDesktop: React.FC<OutlineDesktopProps> = ({ 
  title = 'Work Notes',
  initialItems = [],
  onItemsChange
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
  const [currentOutlineId, setCurrentOutlineId] = useState<string | null>(null);
  const [outlineTitle, setOutlineTitle] = useState(title);
  const [isLoadingOutlines, setIsLoadingOutlines] = useState(false);
  const textAreaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
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

  // Load user's outlines on mount
  useEffect(() => {
    const loadUserOutlines = async () => {
      // Prevent duplicate loads
      if (isLoadingOutlines) return;
      setIsLoadingOutlines(true);
      
      try {
        const { outlinesApi, authApi } = await import('@/services/api/apiClient');
        const user = await authApi.getCurrentUser();
        
        if (!user) {
          console.error('User not authenticated');
          return;
        }
        
        // Pass the user ID correctly - the backend expects it as a query parameter
        const outlines = await outlinesApi.getOutlines();
        console.log('Loaded outlines:', JSON.stringify(outlines, null, 2));
        
        // If no outlines exist, create a default one
        if (!outlines || outlines.length === 0) {
          console.log('No outlines found, creating default outline...');
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
          // Load first outline if available
          if (!currentOutlineId) {
            setCurrentOutlineId(outlines[0].id);
            setOutlineTitle(outlines[0].title);
            const items = await outlinesApi.getOutlineItems(outlines[0].id);
            console.log('Loaded items from outline:', items);
            // Convert backend format to frontend format
            const convertedItems = items.map((item: any) => ({
              ...item,
              text: item.content || item.text || '',
              children: item.children || []
            }));
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

  const selectOutline = async (outlineId: string) => {
    try {
      const { outlinesApi } = await import('@/services/api/apiClient');
      const outline = await outlinesApi.getOutline(outlineId);
      const items = await outlinesApi.getOutlineItems(outlineId);
      
      setCurrentOutlineId(outlineId);
      setOutlineTitle(outline.title);
      // Convert backend format to frontend format
      const convertedItems = items.map((item: any) => ({
        ...item,
        text: item.content || item.text || '',
        children: item.children || []
      }));
      setOutline(convertedItems);
    } catch (error) {
      console.error('Failed to load outline:', error);
    }
  };

  const createNewOutline = async () => {
    try {
      const { outlinesApi, authApi } = await import('@/services/api/apiClient');
      const user = await authApi.getCurrentUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      
      const newOutline = await outlinesApi.createOutline({
        title: `New Outline ${new Date().toLocaleDateString()}`,
        userId: user.id
      });
      
      setUserOutlines([...userOutlines, newOutline]);
      await selectOutline(newOutline.id);
    } catch (error) {
      console.error('Failed to create outline:', error);
    }
  };

  const toggleExpanded = (itemId: string) => {
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
    const updated = updateItems(outline);
    setOutline(updated);
    onItemsChange?.(updated);
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

  const updateItemText = (itemId: string, newText: string): Promise<void> => {
    return new Promise((resolve) => {
      setOutline(prevOutline => {
        const updateItems = (items: OutlineItem[]): OutlineItem[] => {
          return items.map(item => {
            if (item.id === itemId) {
              console.log(`Updating item ${itemId} text to: "${newText}"`);
              return { ...item, text: newText, updatedAt: new Date().toISOString() };
            }
            if (item.children.length > 0) {
              return { ...item, children: updateItems(item.children) };
            }
            return item;
          });
        };
        const updated = updateItems(prevOutline);
        onItemsChange?.(updated);
        
        // Resolve after state update
        setTimeout(() => resolve(), 0);
        return updated;
      });
    }).then(async () => {
      // Save to backend if we have an outline ID
      if (currentOutlineId) {
        try {
          const { outlinesApi } = await import('@/services/api/apiClient');
          
          // Check if this is a new item (temporary ID)
          if (itemId.match(/^item_\d{13}$/)) {
            // Create new item in backend
            const item = outline.find(i => i.id === itemId);
            if (item && newText.trim()) {
              const response = await outlinesApi.createItem(currentOutlineId, {
                content: newText,
                parentId: null,
                style: item.style || 'normal',
                formatting: item.formatting
              });
              console.log('New item created in backend:', response);
              
              // Update the temporary ID with the real ID from backend
              setOutline(prevOutline => {
                const updateIds = (items: OutlineItem[]): OutlineItem[] => {
                  return items.map(i => {
                    if (i.id === itemId) {
                      return { ...i, id: response.id };
                    }
                    if (i.children.length > 0) {
                      return { ...i, children: updateIds(i.children) };
                    }
                    return i;
                  });
                };
                return updateIds(prevOutline);
              });
            }
          } else {
            // Update existing item
            const response = await outlinesApi.updateItem(currentOutlineId, itemId, { content: newText });
            console.log('Item updated in backend:', response);
          }
        } catch (error) {
          console.error('Failed to save item:', error);
        }
      }
    });
  };

  const indentItem = (itemId: string) => {
    // Implementation similar to mobile but with keyboard support
    const updateItems = (items: OutlineItem[]): OutlineItem[] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId && i > 0) {
          const [item] = items.splice(i, 1);
          item.level = items[i - 1].level + 1;
          items[i - 1].children = [...items[i - 1].children, item];
          return [...items];
        }
        if (items[i].children.length > 0) {
          items[i].children = updateItems(items[i].children);
        }
      }
      return items;
    };

    const updated = updateItems([...outline]);
    setOutline(updated);
    onItemsChange?.(updated);
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
        // Remove the empty item
        const removeEmptyItem = (items: OutlineItem[]): OutlineItem[] => {
          return items.filter(item => {
            if (item.id === itemId) {
              return false; // Remove this item
            }
            if (item.children.length > 0) {
              item.children = removeEmptyItem(item.children);
            }
            return true;
          });
        };
        const updated = removeEmptyItem(outline);
        setOutline(updated);
        onItemsChange?.(updated);
        return;
      }
      
      // Update the item text directly in state before creating a new item
      // This ensures the text is saved synchronously
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
            id: `item_${Date.now()}`,
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
          onItemsChange?.(finalUpdated);
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
      return;
    }
    
    // Handle Escape key
    if (e.key === 'Escape') {
      const textarea = e.target as HTMLTextAreaElement;
      const trimmedValue = textarea.value.trim();
      
      if (trimmedValue && trimmedValue !== '') {
        // Save the text before exiting
        await updateItemText(itemId, trimmedValue);
      } else {
        // Remove empty item
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
        onItemsChange?.(updated);
      }
      
      stopEditing();
      return;
    }
    
    // Handle Tab for indentation
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      // Indent the current item (make it a child of the previous item)
      const indentItem = (items: OutlineItem[], targetId: string, prevItem: OutlineItem | null = null): OutlineItem[] => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === targetId && prevItem) {
            // Remove from current position
            const [removed] = items.splice(i, 1);
            removed.level = prevItem.level + 1;
            removed.parentId = prevItem.id;
            // Add as child of previous item
            if (!prevItem.children) prevItem.children = [];
            prevItem.children.push(removed);
            prevItem.expanded = true;
            return items;
          }
          prevItem = items[i];
          if (items[i].children.length > 0) {
            items[i].children = indentItem(items[i].children, targetId, items[i]);
          }
        }
        return items;
      };
      const updated = indentItem([...outline], itemId);
      setOutline(updated);
      onItemsChange?.(updated);
      return;
    }
    
    // Handle Shift+Tab for outdentation
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      // Outdent the current item (move it up one level)
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
      const updated = outdentItem([...outline], itemId);
      setOutline(updated);
      onItemsChange?.(updated);
      return;
    }
    
    // Handle keyboard shortcuts for styles
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b') {
        e.preventDefault();
        toggleItemStyle(itemId, 'header');
      } else if (e.key === 'e') {
        e.preventDefault();
        toggleItemStyle(itemId, 'code');
      } else if (e.key === 'i') {
        e.preventDefault();
        toggleItemStyle(itemId, 'quote');
      }
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
      id: `item_${Date.now()}`,
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
    onItemsChange?.(updated);
    startEditing(newItem.id);
  };

  const toggleItemStyle = async (itemId: string, style: 'header' | 'code' | 'quote' | 'normal') => {
    const updateItems = (items: OutlineItem[]): OutlineItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { 
            ...item, 
            style: style,
            formatting: style === 'header' ? { bold: true, size: 'large' as const } : 
                       style === 'code' ? { size: 'medium' as const } :
                       style === 'quote' ? { italic: true, size: 'medium' as const } :
                       undefined
          };
        }
        if (item.children.length > 0) {
          return { ...item, children: updateItems(item.children) };
        }
        return item;
      });
    };
    const updated = updateItems(outline);
    setOutline(updated);
    onItemsChange?.(updated);
    
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
        
        const item = findItem(updated);
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

  const handleAcceptStructure = (items: OutlineItem[]) => {
    // Add structured items to outline
    const updated = [...outline, ...items];
    setOutline(updated);
    onItemsChange?.(updated);
  };

  const addNewItemAfter = (afterId: string) => {
    // Add a new item after the specified item at the same level
    const newItem: OutlineItem = {
      id: `item_${Date.now()}`,
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
    onItemsChange?.(updated);
    setTimeout(() => startEditing(newItem.id), 0);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-blue-600">BrainFlowy</h1>
          <div className="flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              <a href="/outlines" className="text-gray-700 hover:text-gray-900">My Outlines</a>
              <button onClick={handleLogout} className="text-gray-700 hover:text-gray-900">Logout</button>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
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

        {/* Navigation */}
        <div className="p-2">
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
                  onClick={createNewOutline}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Outline</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="space-y-1">
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-100 transition-colors">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-100 transition-colors">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Help</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">{outlineTitle}</h1>
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
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
              
              <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-gray-600" />
              </button>
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


        {/* Outline Content */}
        <div className="flex-1 px-6 py-6 overflow-auto outline-desktop-container">
          <div className="max-w-4xl outline-desktop-content">
            <div className="space-y-1">
              {flatItems.map((item) => (
                <div
                  key={item.id}
                  className={`group rounded hover:bg-gray-50 transition-colors ${
                    selectedItems.has(item.id) ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
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

                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <textarea
                          ref={(el) => {
                            textAreaRefs.current[item.id] = el;
                          }}
                          defaultValue={item.text}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            console.log('onBlur - value:', value, 'item.text:', item.text, 'item.id:', item.id);
                            // If the field is empty or still "New item", remove the item
                            if (!value || value === 'New item') {
                              // Remove the empty item
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
                              onItemsChange?.(updated);
                            } else if (value !== item.text) {
                              // Update the text if it changed
                              updateItemText(item.id, value);
                            }
                            stopEditing();
                          }}
                          onKeyDown={(e) => handleKeyDown(e, item.id)}
                          className="w-full px-2 py-1 text-sm leading-relaxed bg-white border border-blue-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={item.style === 'code' ? 5 : 1}
                          placeholder=""
                        />
                      ) : (
                        <div
                          onClick={(e) => handleItemClick(e, item.id)}
                          className={`px-2 py-1 leading-relaxed cursor-text rounded hover:bg-gray-100 transition-colors ${
                            item.style === 'header' ? 'text-base font-bold text-gray-900' :
                            item.style === 'code' ? 'font-mono text-xs bg-gray-100 text-gray-800' :
                            item.style === 'quote' ? 'italic text-sm text-gray-700 border-l-4 border-gray-400 pl-3' :
                            'text-sm text-gray-900'
                          }`}
                        >
                          {item.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button 
                onClick={() => addNewItem()}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add new item</span>
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
      />
    </div>
  );
};

export default OutlineDesktop;