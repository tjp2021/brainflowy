import React, { useState, useEffect } from 'react';
import OutlineMobile from './OutlineMobile';
import OutlineDesktop from './OutlineDesktop';
import type { OutlineItem } from '@/types/outline';
import { outlinesApi } from '@/services/api/apiClient';

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

  // Don't load outline data here - let OutlineDesktop handle it
  useEffect(() => {
    setLoading(false);
  }, []);

  const handleItemsChange = async (updatedItems: OutlineItem[]) => {
    // Use setTimeout to avoid setState during render warning
    setTimeout(() => {
      setItems(updatedItems);
    }, 0);
    
    // Save to backend if we have an outline ID
    if (currentOutlineId) {
      setSaving(true);
      try {
        // Map to track old ID -> new ID mappings
        const idMap = new Map<string, string>();
        
        // Track which items need updating (existing items that changed parentId)
        const itemsToUpdate: Array<{ id: string, parentId: string | null }> = [];
        
        // Build a flat list of all items with their expected parentId
        const buildFlatList = (items: OutlineItem[], parentId: string | null = null): void => {
          for (const item of items) {
            // For existing items (not new), track their expected parentId
            if (!item.id.startsWith('item_') && !item.id.startsWith('voice-')) {
              itemsToUpdate.push({ id: item.id, parentId: parentId });
            }
            // Process children recursively
            if (item.children && item.children.length > 0) {
              buildFlatList(item.children, item.id);
            }
          }
        };
        
        // First, identify all items that need parentId updates
        buildFlatList(updatedItems);
        
        // Update existing items' parentId values
        for (const update of itemsToUpdate) {
          try {
            await outlinesApi.updateItem(currentOutlineId, update.id, {
              parentId: update.parentId
            } as any);
          } catch (error) {
            console.error(`Failed to update parentId for item ${update.id}:`, error);
          }
        }
        
        // Process items in order to handle parent-child relationships
        const processNewItems = async (items: OutlineItem[], parentId: string | null = null): Promise<void> => {
          for (const item of items) {
            // Check if this is a new item
            if (item.id.startsWith('item_') || item.id.startsWith('voice-')) {
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
        />
      ) : (
        <OutlineDesktop 
          title={title}
          initialItems={[]} 
          onItemsChange={handleItemsChange}
        />
      )}
    </>
  );
};

// Helper function to convert flat items to hierarchical structure
function convertToHierarchical(flatItems: any[]): OutlineItem[] {
  // This is a simplified version - in real app would properly build hierarchy
  return flatItems.map(item => ({
    id: item.id,
    text: item.content || item.text,
    level: item.level || 0,
    expanded: item.expanded !== false,
    children: item.children || [],
    parentId: item.parentId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));
}

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