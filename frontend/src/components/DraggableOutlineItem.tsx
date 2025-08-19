import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { OutlineItem } from '@/types/outline';

interface DraggableOutlineItemProps {
  item: OutlineItem;
  children: React.ReactNode;
  isSelected?: boolean;
  isDragging?: boolean;
}

export const DraggableOutlineItem: React.FC<DraggableOutlineItemProps> = ({
  item,
  children,
  isSelected = false,
  isDragging = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ 
    id: item.id,
    data: {
      type: 'outline-item',
      item
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border border-blue-200' : ''
      } ${isSortableDragging ? 'dragging opacity-50' : ''}`}
      data-dragging={isSortableDragging}
    >
      <div className="flex items-start">
        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="drag-handle flex items-center px-1 py-2 cursor-move opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity"
          data-drag-handle="true"
        >
          <GripVertical size={16} className="text-gray-400" />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};