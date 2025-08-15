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