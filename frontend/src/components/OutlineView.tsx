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
            
            // Debug: Log what we got from backend
            console.log('OutlineView: Got', backendItems.length, 'items from backend');
            console.log('Sample backend item:', backendItems[0]);
            
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
            
            const hierarchicalItems = mapHierarchicalItems(backendItems);
            
            console.log('OutlineView: After mapping:', hierarchicalItems.length, 'root items');
            hierarchicalItems.forEach(item => {
              console.log(`- ${item.text} (children: ${item.children ? item.children.length : 0})`);
            });
            
            // Debug: Log the converted structure
            if (hierarchicalItems.length > 0) {
              console.log('First root item:', hierarchicalItems[0]);
            }
            
            setItems(hierarchicalItems);
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

  const handleItemsChange = async (updatedItems: OutlineItem[]) => {
    
    // Use setTimeout to avoid setState during render warning
    setTimeout(() => {
      setItems(updatedItems);
    }, 0);
    
    // Save to backend if we have an outline ID
    if (currentOutlineId) {
      console.log('Have outline ID, proceeding with save...');
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
          console.log('Processing items for save:', items.length, 'items');
          for (const item of items) {
            console.log('Processing item:', item.id, 'text:', item.text);
            // Check if this is a new item
            if (item.id.startsWith('item_') || item.id.startsWith('voice-')) {
              console.log('Item identified as new, checking text...');
              // Skip items without text or with default "New Item" text
              if (!item.text || item.text === 'New Item' || item.text.trim() === '') {
                console.log('Skipping item with empty/default text');
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
          onItemsChange={(updatedItems) => {
            setItems(updatedItems);
          }}
        />
      ) : (
        <OutlineDesktop 
          title={title}
          initialItems={items} 
          onItemsChange={handleItemsChange}
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