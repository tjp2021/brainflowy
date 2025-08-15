import React, { useState, useEffect } from 'react';
import OutlineMobile from './OutlineMobile';
import OutlineDesktop from './OutlineDesktop';
import type { OutlineItem } from '@/types/outline';
import { mockOutlineService } from '@/services/api/mockOutlines';

interface OutlineViewProps {
  outlineId?: string;
}

const OutlineView: React.FC<OutlineViewProps> = ({ outlineId }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Work Notes');

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load outline data
  useEffect(() => {
    const loadOutline = async () => {
      setLoading(true);
      try {
        if (outlineId) {
          const outline = await mockOutlineService.getOutline(outlineId);
          const items = await mockOutlineService.getOutlineItems(outlineId);
          setTitle(outline.title);
          
          // Convert flat items to hierarchical structure
          const hierarchicalItems = convertToHierarchical(items);
          setItems(hierarchicalItems);
        } else {
          // Load default sample data
          setItems(getSampleOutlineData());
        }
      } catch (error) {
        console.error('Failed to load outline:', error);
        // Use sample data as fallback
        setItems(getSampleOutlineData());
      } finally {
        setLoading(false);
      }
    };

    loadOutline();
  }, [outlineId]);

  const handleItemsChange = async (updatedItems: OutlineItem[]) => {
    setItems(updatedItems);
    
    // Save to mock API
    if (outlineId) {
      try {
        // In a real app, we'd update the items in the backend
        console.log('Saving items:', updatedItems);
      } catch (error) {
        console.error('Failed to save items:', error);
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

  return isMobile ? (
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
    />
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
      children: [
        {
          id: '2',
          text: 'Social Media Strategy',
          level: 1,
          expanded: true,
          children: [
            { id: '3', text: 'Instagram content calendar', level: 2, expanded: false, children: [] },
            { id: '4', text: 'TikTok video series', level: 2, expanded: false, children: [] }
          ]
        },
        { id: '5', text: 'Budget planning', level: 1, expanded: false, children: [] },
        { id: '6', text: 'Team assignments', level: 1, expanded: false, children: [] }
      ]
    },
    {
      id: '7',
      text: 'Product Launch',
      level: 0,
      expanded: false,
      children: [
        { id: '8', text: 'Beta testing feedback', level: 1, expanded: false, children: [] },
        { id: '9', text: 'Launch timeline', level: 1, expanded: false, children: [] }
      ]
    },
    {
      id: '10',
      text: 'Weekly team meeting agenda',
      level: 0,
      expanded: true,
      children: [
        { id: '11', text: 'Project updates', level: 1, expanded: false, children: [] },
        { id: '12', text: 'Blockers and issues', level: 1, expanded: false, children: [] }
      ]
    }
  ];
}

export default OutlineView;