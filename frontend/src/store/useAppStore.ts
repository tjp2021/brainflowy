import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AppStore, Node, User } from '@/types';

// Initial state
const initialState = {
  user: null,
  nodes: [],
  selectedNodeId: null,
  isLoading: false,
  error: null,
};

// Create the app store with Zustand
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // User actions
        setUser: (user: User | null) => {
          set({ user }, false, 'setUser');
        },

        // Node actions
        setNodes: (nodes: Node[]) => {
          set({ nodes }, false, 'setNodes');
        },

        addNode: (node: Node) => {
          const { nodes } = get();
          set({ nodes: [...nodes, node] }, false, 'addNode');
        },

        updateNode: (id: string, updates: Partial<Node>) => {
          const { nodes } = get();
          const updatedNodes = nodes.map(node =>
            node.id === id
              ? { ...node, ...updates, updatedAt: new Date() }
              : node
          );
          set({ nodes: updatedNodes }, false, 'updateNode');
        },

        deleteNode: (id: string) => {
          const { nodes, selectedNodeId } = get();
          const filteredNodes = nodes.filter(node => node.id !== id);
          const newSelectedNodeId = selectedNodeId === id ? null : selectedNodeId;
          
          set(
            { 
              nodes: filteredNodes,
              selectedNodeId: newSelectedNodeId 
            },
            false,
            'deleteNode'
          );
        },

        // Selection actions
        setSelectedNodeId: (id: string | null) => {
          set({ selectedNodeId: id }, false, 'setSelectedNodeId');
        },

        // UI state actions
        setLoading: (isLoading: boolean) => {
          set({ isLoading }, false, 'setLoading');
        },

        setError: (error: string | null) => {
          set({ error }, false, 'setError');
        },
      }),
      {
        name: 'brainflowy-store',
        partialize: (state) => ({
          user: state.user,
          nodes: state.nodes,
          selectedNodeId: state.selectedNodeId,
          isLoading: false,
          error: null,
          // Include action functions to maintain type compatibility
          setUser: state.setUser,
          setNodes: state.setNodes,
          addNode: state.addNode,
          updateNode: state.updateNode,
          deleteNode: state.deleteNode,
          setSelectedNodeId: state.setSelectedNodeId,
          setLoading: state.setLoading,
          setError: state.setError,
        }),
      }
    ),
    {
      name: 'brainflowy-store',
    }
  )
);

// Selectors
export const useUser = () => useAppStore(state => state.user);
export const useNodes = () => useAppStore(state => state.nodes);
export const useSelectedNodeId = () => useAppStore(state => state.selectedNodeId);
export const useSelectedNode = () => {
  const nodes = useNodes();
  const selectedNodeId = useSelectedNodeId();
  return nodes.find(node => node.id === selectedNodeId) || null;
};
export const useIsLoading = () => useAppStore(state => state.isLoading);
export const useError = () => useAppStore(state => state.error);

// Action selectors
export const useAppActions = () => useAppStore(state => ({
  setUser: state.setUser,
  setNodes: state.setNodes,
  addNode: state.addNode,
  updateNode: state.updateNode,
  deleteNode: state.deleteNode,
  setSelectedNodeId: state.setSelectedNodeId,
  setLoading: state.setLoading,
  setError: state.setError,
}));