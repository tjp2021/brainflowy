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
      setSaving(true);
      try {
        // STEP 1: Get current backend state to compare
        const backendItems = await outlinesApi.getOutlineItems(currentOutlineId);
        
        // STEP 2: Build set of frontend IDs and their data
        const frontendItemsMap = new Map<string, OutlineItem>();
        const collectFrontendItems = (items: OutlineItem[], parentId: string | null = null) => {
          for (const item of items) {
            const isNewItem = item.id.match(/^item_\d{13}$/) || item.id.startsWith('voice-');
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
            const isNewItem = item.id.match(/^item_\d{13}$/) || item.id.startsWith('voice-');
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
        />
      ) : (
        <OutlineDesktop 
          title={title}
          initialItems={items} 
          onItemsChange={handleItemsChange}
          outlineId={currentOutlineId}
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