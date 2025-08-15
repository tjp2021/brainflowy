import React, { useState, useRef } from 'react';
import { 
  Plus, Mic, Search, ChevronRight, ChevronDown, ChevronLeft, 
  Folder, Settings, HelpCircle, MoreHorizontal 
} from 'lucide-react';
import type { OutlineItem } from '@/types/outline';
import VoiceModal from './VoiceModal';

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
  onItemsChange,
  sidebarItems = [
    { id: 'work', name: 'Work Notes', icon: Folder, active: true },
    { id: 'personal', name: 'Personal', icon: Folder, active: false },
    { id: 'projects', name: 'Projects', icon: Folder, active: false },
    { id: 'archive', name: 'Archive', icon: Folder, active: false },
  ]
}) => {
  const [outline, setOutline] = useState<OutlineItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const textAreaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

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
      textAreaRefs.current[itemId]?.focus();
    }, 0);
  };

  const stopEditing = () => {
    setEditingId(null);
  };

  const updateItemText = (itemId: string, newText: string) => {
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
    const updated = updateItems(outline);
    setOutline(updated);
    onItemsChange?.(updated);
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

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const textarea = textAreaRefs.current[itemId];
      if (textarea) {
        updateItemText(itemId, textarea.value);
      }
      stopEditing();
      // Create new item below current
      if (!e.ctrlKey) {
        addNewItemAfter(itemId);
      }
    } else if (e.key === 'Escape') {
      stopEditing();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        outdentItem(itemId);
      } else {
        indentItem(itemId);
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

  const addNewItem = () => {
    const newItem: OutlineItem = {
      id: `item_${Date.now()}`,
      text: 'New item',
      level: 0,
      expanded: false,
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...outline, newItem];
    setOutline(updated);
    onItemsChange?.(updated);
    startEditing(newItem.id);
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
      updatedAt: new Date().toISOString()
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
              <button className="text-gray-700 hover:text-gray-900">Logout</button>
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
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    item.active 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              ))}
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={addNewItem}
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
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
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

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
            <span><kbd className="px-1 bg-gray-100 rounded">Tab</kbd> to indent</span>
            <span><kbd className="px-1 bg-gray-100 rounded">Shift+Tab</kbd> to outdent</span>
            <span><kbd className="px-1 bg-gray-100 rounded">Enter</kbd> for new item</span>
            <span><kbd className="px-1 bg-gray-100 rounded">Ctrl+Click</kbd> to multi-select</span>
          </div>
        </div>


        {/* Outline Content */}
        <div className="flex-1 px-6 py-6 overflow-auto">
          <div className="max-w-4xl">
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
                          onBlur={stopEditing}
                          onKeyDown={(e) => handleKeyDown(e, item.id)}
                          className="w-full px-2 py-1 text-sm leading-relaxed bg-white border border-blue-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={1}
                        />
                      ) : (
                        <div
                          onClick={(e) => handleItemClick(e, item.id)}
                          className="px-2 py-1 text-sm leading-relaxed text-gray-900 cursor-text rounded hover:bg-gray-100 transition-colors"
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
                onClick={addNewItem}
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