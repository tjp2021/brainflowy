export interface OutlineItem {
  id: string;
  text: string;
  level: number;
  expanded: boolean;
  children: OutlineItem[];
  parentId?: string | null;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  // Enhanced properties for styling
  style?: 'header' | 'code' | 'quote' | 'normal';
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    size?: 'large' | 'medium' | 'small';
  } | undefined;
}

export interface Outline {
  id: string;
  title: string;
  userId: string;
  items: OutlineItem[];
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

export interface SwipeState {
  id: string | null;
  direction: 'left' | 'right' | null;
  startX: number;
}