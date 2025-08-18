import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Search, Menu, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';
import type { OutlineItem, SwipeState } from '@/types/outline';
import VoiceModal from './VoiceModal';
import '../styles/outline.css';

interface OutlineMobileProps {
  title?: string;
  initialItems?: OutlineItem[];
  onItemsChange?: (items: OutlineItem[]) => void;
}

const OutlineMobile: React.FC<OutlineMobileProps> = ({ 
  title = 'Work Notes',
  initialItems = [],
  onItemsChange 
}) => {
  const [outline, setOutline] = useState<OutlineItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({ id: null, direction: null, startX: 0 });
  const [showInstructions, setShowInstructions] = useState(true);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'header' | 'code' | 'quote' | 'normal'>('normal');
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [lastTappedId, setLastTappedId] = useState<string | null>(null);
  const textAreaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  useEffect(() => {
    // Hide instructions after 5 seconds
    const timer = setTimeout(() => setShowInstructions(false), 5000);
    return () => clearTimeout(timer);
  }, []);

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

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    const touch = e.touches[0];
    setSwipeState({
      id: itemId,
      direction: null,
      startX: touch.clientX
    });
    
    // Set up long press detection
    const timer = setTimeout(() => {
      // Long press detected - toggle expand/collapse
      toggleExpanded(itemId);
      // Vibrate if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e: React.TouchEvent, itemId: string) => {
    if (swipeState.id !== itemId) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    
    if (Math.abs(deltaX) > 20) {
      const direction = deltaX > 0 ? 'right' : 'left';
      setSwipeState(prev => ({ ...prev, direction }));
    }
  };

  const handleTouchEnd = (_e: React.TouchEvent, itemId: string) => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (swipeState.id !== itemId) return;
    
    if (swipeState.direction === 'right') {
      indentItem(itemId);
    } else if (swipeState.direction === 'left') {
      outdentItem(itemId);
    }
    
    setSwipeState({ id: null, direction: null, startX: 0 });
  };

  const indentItem = (itemId: string) => {
    // Find the item and its previous sibling to make it a child
    const updateItems = (items: OutlineItem[]): OutlineItem[] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId && i > 0) {
          // Remove item from current position
          const [item] = items.splice(i, 1);
          // Add as child to previous sibling
          item.level = items[i - 1].level + 1;
          items[i - 1].children = [...items[i - 1].children, item];
          return [...items];
        }
        // Recursively check children
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
    // Move item up one level in hierarchy
    const updateItems = (items: OutlineItem[], _parentLevel = 0): OutlineItem[] => {
      return items.map(item => {
        if (item.children.some(child => child.id === itemId)) {
          // Find and remove the child
          const childIndex = item.children.findIndex(child => child.id === itemId);
          const [child] = item.children.splice(childIndex, 1);
          child.level = item.level;
          // Add after parent in the parent's array
          // This is simplified - in real app would need to handle properly
          return item;
        }
        if (item.children.length > 0) {
          item.children = updateItems(item.children, item.level);
        }
        return item;
      });
    };

    const updated = updateItems([...outline]);
    setOutline(updated);
    onItemsChange?.(updated);
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
      if (textAreaRefs.current[itemId]) {
        textAreaRefs.current[itemId]?.focus();
      }
    }, 0);
  };

  const stopEditing = () => {
    setEditingId(null);
  };

  const updateItemText = (itemId: string, newText: string) => {
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
    const updated = updateItems(outline);
    setOutline(updated);
    onItemsChange?.(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const textarea = textAreaRefs.current[itemId];
      if (textarea) {
        updateItemText(itemId, textarea.value);
      }
      stopEditing();
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

  const addNewItem = (text: string = 'New item', style?: 'header' | 'code' | 'quote' | 'normal') => {
    const newItem: OutlineItem = {
      id: `item_${Date.now()}`,
      text: text,
      level: 0,
      expanded: false,
      children: [],
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

  const toggleItemStyle = (itemId: string, style: 'header' | 'code' | 'quote' | 'normal') => {
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
  };

  const handleAcceptStructure = (items: OutlineItem[]) => {
    // Add structured items to outline
    const updated = [...outline, ...items];
    setOutline(updated);
    onItemsChange?.(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <button className="p-1 rounded hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-1">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="px-4 py-6 outline-mobile-container">
        <div className="space-y-1 outline-mobile-content">
          {flatItems.map((item) => (
            <div
              key={item.id}
              className={`relative transition-transform duration-200 ${
                swipeState.id === item.id && swipeState.direction === 'right' ? 'translate-x-2' :
                swipeState.id === item.id && swipeState.direction === 'left' ? '-translate-x-2' : ''
              }`}
              style={{ paddingLeft: `${item.level * 24 + 8}px` }}
              onTouchStart={(e) => handleTouchStart(e, item.id)}
              onTouchMove={(e) => handleTouchMove(e, item.id)}
              onTouchEnd={(e) => handleTouchEnd(e, item.id)}
            >
              <div className="flex items-start space-x-2 py-2 group">
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-1 rounded hover:bg-gray-200 transition-colors"
                >
                  {item.children.length > 0 ? (
                    item.expanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
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
                      className="w-full p-2 text-base leading-relaxed bg-white border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={1}
                      style={{ minHeight: '44px' }}
                    />
                  ) : (
                    <div
                      onClick={() => {
                        const now = Date.now();
                        if (lastTappedId === item.id && now - lastTapTime < 300) {
                          // Double tap detected - cycle through styles
                          const styles: Array<'normal' | 'header' | 'code' | 'quote'> = ['normal', 'header', 'code', 'quote'];
                          const currentIndex = styles.indexOf(item.style || 'normal');
                          const nextStyle = styles[(currentIndex + 1) % styles.length];
                          toggleItemStyle(item.id, nextStyle);
                        } else {
                          // Single tap - start editing
                          startEditing(item.id);
                        }
                        setLastTapTime(now);
                        setLastTappedId(item.id);
                      }}
                      className={`p-2 leading-relaxed cursor-text rounded hover:bg-gray-100 transition-colors group-hover:bg-gray-50 ${
                        item.style === 'header' ? 'text-lg font-bold text-gray-900' :
                        item.style === 'code' ? 'font-mono text-sm bg-gray-100 text-gray-800' :
                        item.style === 'quote' ? 'italic text-gray-700 border-l-4 border-gray-400 pl-4' :
                        'text-base text-gray-900'
                      }`}
                      style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
                    >
                      {item.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 mb-20">
          <button 
            onClick={() => addNewItem()}
            className="flex items-center space-x-2 w-full p-3 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-base">Add new item</span>
          </button>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Style Selector */}
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setSelectedStyle('normal')}
              className={`px-3 py-1.5 rounded text-sm ${
                selectedStyle === 'normal' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              }`}
            >
              Normal
            </button>
            <button 
              onClick={() => setSelectedStyle('header')}
              className={`px-3 py-1.5 rounded text-sm font-bold ${
                selectedStyle === 'header' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              }`}
            >
              Header
            </button>
            <button 
              onClick={() => setSelectedStyle('code')}
              className={`px-3 py-1.5 rounded text-sm font-mono ${
                selectedStyle === 'code' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              }`}
            >
              Code
            </button>
            <button 
              onClick={() => setSelectedStyle('quote')}
              className={`px-3 py-1.5 rounded text-sm italic ${
                selectedStyle === 'quote' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              }`}
            >
              Quote
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowVoiceModal(true)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              <Mic className="w-6 h-6" />
            </button>
            
            <button className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Modal */}
      <VoiceModal 
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onAcceptStructure={handleAcceptStructure}
      />

      {/* Instructions */}
      {showInstructions && (
        <div className="fixed bottom-20 left-4 right-4 bg-gray-900 text-white rounded-lg p-3 shadow-lg opacity-90">
          <div className="text-sm space-y-1">
            <div>• Swipe right to indent, left to outdent</div>
            <div>• Long press to expand/collapse</div>
            <div>• Tap to edit, Double-tap to change style</div>
            <div>• Select style below for new items</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlineMobile;