import type { OutlineItem } from '@/types/outline';

/**
 * Converts flat backend items to hierarchical structure
 * This is the single source of truth for building hierarchy
 */
export function buildHierarchyFromFlat(flatItems: any[]): OutlineItem[] {
  const itemMap = new Map<string, OutlineItem>();
  const rootItems: OutlineItem[] = [];
  
  // First pass: create all items
  flatItems.forEach(item => {
    const outlineItem: OutlineItem = {
      id: item.id,
      text: item.content || item.text || '', // Ensure we get the content
      level: 0, // Will be calculated based on hierarchy
      expanded: true, // Expand by default to show all content
      children: [],
      parentId: item.parentId,
      style: item.style,
      formatting: item.formatting,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
    itemMap.set(item.id, outlineItem);
  });
  
  // Second pass: build hierarchy
  flatItems.forEach(item => {
    const outlineItem = itemMap.get(item.id);
    if (outlineItem) {
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        parent.children.push(outlineItem);
        outlineItem.level = parent.level + 1;
      } else {
        rootItems.push(outlineItem);
      }
    }
  });
  
  // Sort items by order field if it exists
  const sortByOrder = (items: OutlineItem[]) => {
    items.sort((a, b) => {
      const aItem = flatItems.find(i => i.id === a.id);
      const bItem = flatItems.find(i => i.id === b.id);
      return (aItem?.order || 0) - (bItem?.order || 0);
    });
    items.forEach(item => sortByOrder(item.children));
  };
  
  sortByOrder(rootItems);
  return rootItems;
}

/**
 * Flattens hierarchical structure for rendering or processing
 */
export function flattenHierarchy(items: OutlineItem[], result: OutlineItem[] = []): OutlineItem[] {
  items.forEach(item => {
    result.push(item);
    if (item.expanded && item.children.length > 0) {
      flattenHierarchy(item.children, result);
    }
  });
  return result;
}

