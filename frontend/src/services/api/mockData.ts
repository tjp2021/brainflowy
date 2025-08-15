import type {
  User,
  Outline,
  OutlineNode,
  OutlineTemplate,
  Comment,
  Attachment
} from './types';

// Helper function to generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to generate random date within range
const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Mock user data
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'demo@brainflowy.com',
    username: 'demo_user',
    fullName: 'Demo User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-08-14'),
    preferences: {
      theme: 'light',
      language: 'en',
      defaultViewMode: 'hybrid',
      autoSave: true,
      autoSaveInterval: 30
    }
  },
  {
    id: 'user-2',
    email: 'alice@example.com',
    username: 'alice_wonder',
    fullName: 'Alice Wonder',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-08-10'),
    preferences: {
      theme: 'dark',
      language: 'en',
      defaultViewMode: 'mindmap',
      autoSave: true,
      autoSaveInterval: 60
    }
  },
  {
    id: 'user-3',
    email: 'bob@example.com',
    username: 'bob_builder',
    fullName: 'Bob Builder',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-08-12'),
    preferences: {
      theme: 'system',
      language: 'en',
      defaultViewMode: 'outline',
      autoSave: false,
      autoSaveInterval: 120
    }
  }
];

// Mock node generator
export const generateMockNode = (
  content: string,
  depth: number = 0,
  maxDepth: number = 3,
  parentId?: string
): OutlineNode => {
  const nodeId = generateId();
  const hasChildren = depth < maxDepth && Math.random() > 0.5;
  const numChildren = hasChildren ? Math.floor(Math.random() * 4) + 1 : 0;
  
  const nodeTypes = ['text', 'heading', 'task', 'link'] as const;
  const nodeType = depth === 0 ? 'heading' : nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
  
  const node: OutlineNode = {
    id: nodeId,
    content,
    type: nodeType,
    children: [],
    parentId: parentId || '',
    position: {
      x: Math.random() * 800,
      y: Math.random() * 600,
      order: 0
    },
    style: depth === 0 ? {
      color: '#333333',
      backgroundColor: '#f0f9ff',
      fontSize: 18,
      fontWeight: 'bold' as const,
      shape: 'rectangle' as const
    } : {
      color: '#333333',
      fontSize: 14,
      fontWeight: 'normal' as const,
      shape: 'rectangle' as const
    },
    metadata: {
      createdAt: randomDate(new Date('2024-01-01'), new Date()),
      updatedAt: new Date(),
      createdBy: mockUsers[0].id,
      attachments: [],
      comments: [],
      linkedNodes: []
    },
    isExpanded: true,
    ...(nodeType === 'task' && { isCompleted: Math.random() > 0.5 })
  };
  
  if (numChildren > 0) {
    const childTopics = [
      'Subtopic', 'Detail', 'Example', 'Note', 'Task', 'Idea', 'Reference',
      'Question', 'Action Item', 'Research', 'Definition', 'Concept'
    ];
    
    node.children = Array.from({ length: numChildren }, (_, i) => {
      const childContent = `${childTopics[Math.floor(Math.random() * childTopics.length)]} ${i + 1}`;
      return generateMockNode(childContent, depth + 1, maxDepth, nodeId);
    }).map((child, index) => ({
      ...child,
      position: { ...child.position, order: index }
    }));
  }
  
  return node;
};

// Mock outlines
export const generateMockOutlines = (): Outline[] => {
  const topics = [
    { title: 'Project Planning', description: 'Q4 2024 Product Roadmap' },
    { title: 'Meeting Notes', description: 'Weekly team sync - August 14' },
    { title: 'Research: AI in Education', description: 'Literature review and key findings' },
    { title: 'Personal Goals 2024', description: 'Annual objectives and milestones' },
    { title: 'Book Notes: Atomic Habits', description: 'Key concepts and actionable insights' },
    { title: 'Startup Ideas', description: 'Brainstorming session for new ventures' },
    { title: 'Learning Path: TypeScript', description: 'Advanced TypeScript concepts and patterns' },
    { title: 'Travel Planning: Japan', description: 'Itinerary for 2 weeks in Japan' }
  ];
  
  return topics.map((topic, index) => ({
    id: `outline-${index + 1}`,
    userId: mockUsers[index % mockUsers.length].id,
    title: topic.title,
    description: topic.description,
    rootNode: generateMockNode(topic.title, 0, 3),
    tags: generateTags(),
    isPublic: Math.random() > 0.7,
    isShared: Math.random() > 0.8,
    sharedWith: Math.random() > 0.8 ? [mockUsers[1].id, mockUsers[2].id] : [],
    createdAt: randomDate(new Date('2024-01-01'), new Date('2024-07-01')),
    updatedAt: randomDate(new Date('2024-07-01'), new Date()),
    lastAccessedAt: new Date(),
    settings: {
      defaultNodeStyle: {
        color: '#333333',
        fontSize: 14,
        fontWeight: 'normal',
        shape: 'rectangle'
      },
      showConnections: true,
      layoutType: 'tree',
      zoomLevel: 1,
      panPosition: { x: 0, y: 0 }
    }
  }));
};

// Generate random tags
const generateTags = (): string[] => {
  const allTags = [
    'work', 'personal', 'research', 'ideas', 'planning',
    'meeting', 'learning', 'project', 'goals', 'notes',
    'important', 'urgent', 'review', 'draft', 'final'
  ];
  
  const numTags = Math.floor(Math.random() * 4) + 1;
  const tags: string[] = [];
  
  while (tags.length < numTags) {
    const tag = allTags[Math.floor(Math.random() * allTags.length)];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags;
};

// Mock templates
export const mockTemplates: OutlineTemplate[] = [
  {
    id: 'template-1',
    name: 'SWOT Analysis',
    description: 'Analyze strengths, weaknesses, opportunities, and threats',
    category: 'Business',
    structure: generateMockNode('SWOT Analysis', 0, 2),
    thumbnail: 'https://via.placeholder.com/200x150',
    usageCount: 1250,
    rating: 4.5,
    isPremium: false
  },
  {
    id: 'template-2',
    name: 'Meeting Agenda',
    description: 'Structure your meetings effectively',
    category: 'Productivity',
    structure: generateMockNode('Meeting Agenda', 0, 2),
    thumbnail: 'https://via.placeholder.com/200x150',
    usageCount: 890,
    rating: 4.3,
    isPremium: false
  },
  {
    id: 'template-3',
    name: 'Book Summary',
    description: 'Capture key insights from books',
    category: 'Education',
    structure: generateMockNode('Book Summary', 0, 3),
    thumbnail: 'https://via.placeholder.com/200x150',
    usageCount: 650,
    rating: 4.7,
    isPremium: true
  },
  {
    id: 'template-4',
    name: 'Project Kickoff',
    description: 'Launch projects with comprehensive planning',
    category: 'Project Management',
    structure: generateMockNode('Project Kickoff', 0, 3),
    thumbnail: 'https://via.placeholder.com/200x150',
    usageCount: 1100,
    rating: 4.6,
    isPremium: false
  },
  {
    id: 'template-5',
    name: 'Brainstorming Session',
    description: 'Capture and organize creative ideas',
    category: 'Creativity',
    structure: generateMockNode('Brainstorming', 0, 2),
    thumbnail: 'https://via.placeholder.com/200x150',
    usageCount: 780,
    rating: 4.4,
    isPremium: false
  }
];

// Mock comments generator
export const generateMockComments = (count: number = 3): Comment[] => {
  const comments: Comment[] = [];
  const sampleTexts = [
    'Great point! This aligns well with our objectives.',
    'We should consider the budget implications here.',
    'Can we add more details about the timeline?',
    'This needs review from the legal team.',
    'Excellent research! Very comprehensive.',
    'Let\'s discuss this in the next meeting.'
  ];
  
  for (let i = 0; i < count; i++) {
    comments.push({
      id: generateId(),
      userId: mockUsers[Math.floor(Math.random() * mockUsers.length)].id,
      content: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
      createdAt: randomDate(new Date('2024-01-01'), new Date()),
      replies: Math.random() > 0.7 ? generateMockComments(1) : []
    });
  }
  
  return comments;
};

// Mock attachments generator
export const generateMockAttachments = (count: number = 2): Attachment[] => {
  const attachments: Attachment[] = [];
  const fileTypes = [
    { filename: 'document.pdf', mimeType: 'application/pdf', size: 2048000 },
    { filename: 'spreadsheet.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 1024000 },
    { filename: 'presentation.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 5120000 },
    { filename: 'image.png', mimeType: 'image/png', size: 512000 },
    { filename: 'notes.txt', mimeType: 'text/plain', size: 10240 }
  ];
  
  for (let i = 0; i < count; i++) {
    const file = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    attachments.push({
      id: generateId(),
      ...file,
      url: `https://storage.brainflowy.com/${generateId()}/${file.filename}`,
      uploadedAt: randomDate(new Date('2024-01-01'), new Date())
    });
  }
  
  return attachments;
};

// Initialize mock data
export const mockOutlines = generateMockOutlines();

// Session storage for current user
export const getCurrentUser = (): User | null => {
  const userJson = sessionStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('currentUser');
  }
};

// Local storage for persistent data
export const getStoredOutlines = (): Outline[] => {
  const stored = localStorage.getItem('mockOutlines');
  return stored ? JSON.parse(stored) : mockOutlines;
};

export const saveOutlines = (outlines: Outline[]): void => {
  localStorage.setItem('mockOutlines', JSON.stringify(outlines));
};