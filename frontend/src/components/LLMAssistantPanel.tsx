import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Edit3, Plus, Search } from 'lucide-react';
import type { OutlineItem } from '@/types/outline';

interface LLMAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem?: OutlineItem | null;
  currentSection?: string;
  onApplyAction: (action: LLMAction, response: LLMResponse) => void;
}

export interface LLMAction {
  type: 'create' | 'edit' | 'research';
  targetId?: string;
  parentId?: string;
  section?: string;
  prompt: string;
}

export interface LLMResponse {
  content?: string;
  items?: Array<{
    text: string;
    children?: Array<{ text: string }>;
  }>;
  suggestions?: string[];
  citations?: Array<{
    text: string;
    source: string;
    url?: string;
  }>;
}

interface ConversationEntry {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  action?: LLMAction;
  response?: LLMResponse;
  timestamp: Date;
}

// Mock LLM responses for development
const MOCK_RESPONSES: Record<string, LLMResponse> = {
  create_spov: {
    items: [
      {
        text: 'AI-Driven Customer Retention Strategy',
        children: [
          {
            text: 'Description:',
            children: [
              { text: 'Implement predictive analytics to identify at-risk customers 30 days before churn and deploy targeted retention campaigns' }
            ]
          },
          {
            text: 'Evidence:',
            children: [
              { text: 'Companies using predictive churn models see 20-25% reduction in customer attrition' },
              { text: 'Early intervention increases retention success rate by 3x compared to reactive approaches' },
              { text: 'Average ROI of $5 for every $1 spent on proactive retention initiatives' }
            ]
          },
          {
            text: 'Implementation Levers:',
            children: [
              { text: 'Deploy machine learning model trained on 24 months of customer behavior data' },
              { text: 'Create automated intervention workflows triggered by risk scores' },
              { text: 'Establish real-time alerting system for customer success team' }
            ]
          }
        ]
      }
    ],
    suggestions: [
      'Would you like to add specific metrics for measuring success?',
      'Should we include a timeline for implementation?',
      'Do you want to add risk factors to consider?'
    ]
  },
  edit_purpose: {
    content: 'To determine whether to maintain our current per-seat pricing model or transition to usage-based pricing by Q2 2024, based on competitive analysis and customer feedback from our enterprise segment',
    suggestions: [
      'Add specific decision criteria',
      'Include key stakeholders who need to approve',
      'Define what success looks like'
    ]
  },
  research_market: {
    content: 'Based on current market analysis:',
    citations: [
      {
        text: '61% of SaaS companies have adopted or are transitioning to usage-based pricing',
        source: 'OpenView Partners State of SaaS Pricing 2024',
        url: 'https://example.com/report'
      },
      {
        text: 'Enterprise buyers show 2.3x preference for predictable per-seat costs',
        source: 'Gartner SaaS Buying Behavior Survey',
        url: 'https://example.com/gartner'
      }
    ],
    suggestions: [
      'Would you like me to research competitor pricing models?',
      'Should I analyze your current customer usage patterns?'
    ]
  }
};

export const LLMAssistantPanel: React.FC<LLMAssistantPanelProps> = ({
  isOpen,
  onClose,
  currentItem,
  currentSection,
  onApplyAction
}) => {
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMode, setActionMode] = useState<'create' | 'edit' | 'research'>('create');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Auto-set action mode based on context
  useEffect(() => {
    if (currentItem) {
      setActionMode('edit');
    } else {
      setActionMode('create');
    }
  }, [currentItem]);

  // Clear everything when panel closes
  useEffect(() => {
    if (!isOpen) {
      // Clear the text field
      setPrompt('');
      // Clear the conversation history
      setConversation([]);
      // Reset processing state
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    const userPrompt = prompt.trim();
    setPrompt('');
    setIsProcessing(true);

    // Create action based on current mode
    const action: LLMAction = {
      type: actionMode,
      targetId: currentItem?.id,
      parentId: currentItem?.parentId,
      section: currentSection || detectSection(userPrompt),
      prompt: userPrompt
    };

    // Add user message to conversation
    const userEntry: ConversationEntry = {
      id: Date.now().toString(),
      type: 'user',
      content: userPrompt,
      action,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userEntry]);

    try {
      // Call real backend API
      const token = localStorage.getItem('accessToken');
      const outlineId = localStorage.getItem('currentOutlineId') || 'test-outline';
      
      const apiResponse = await fetch(`http://localhost:8001/api/v1/outlines/${outlineId}/llm-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: actionMode,
          targetId: currentItem?.id,
          parentId: currentItem?.parentId,
          section: currentSection || detectSection(userPrompt),
          userPrompt: userPrompt,
          currentContent: currentItem?.text  // Send current content for editing context
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      const response = data.result;

      // Add assistant response to conversation
      const assistantEntry: ConversationEntry = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: formatResponseForDisplay(response),
        response,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, assistantEntry]);

      // Apply the action
      onApplyAction(action, response);
    } catch (error) {
      console.error('Error calling LLM API:', error);
      
      // Fall back to mock response on error
      const response = getMockResponse(action);
      
      const assistantEntry: ConversationEntry = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '⚠️ Using offline mode. ' + formatResponseForDisplay(response),
        response,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, assistantEntry]);
      
      // Still apply the action with mock response
      onApplyAction(action, response);
    } finally {
      setIsProcessing(false);
      // Focus back on input
      textareaRef.current?.focus();
    }
  };

  const getMockResponse = (action: LLMAction): LLMResponse => {
    // Simple keyword matching for mock responses
    const prompt = action.prompt.toLowerCase();
    
    if (prompt.includes('spov') || prompt.includes('retention') || prompt.includes('churn')) {
      return MOCK_RESPONSES.create_spov;
    } else if (prompt.includes('purpose') || prompt.includes('pricing')) {
      return MOCK_RESPONSES.edit_purpose;
    } else if (prompt.includes('research') || prompt.includes('market') || prompt.includes('find')) {
      return MOCK_RESPONSES.research_market;
    }
    
    // Default response
    return {
      content: `I'll help you ${action.type === 'edit' ? 'edit' : 'create'} that content.`,
      suggestions: ['Tell me more about what you need', 'Would you like me to add more detail?']
    };
  };

  const detectSection = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes('spov')) return 'spov';
    if (lower.includes('purpose')) return 'purpose';
    if (lower.includes('owner')) return 'owner';
    if (lower.includes('scope')) return 'out_of_scope';
    if (lower.includes('overview')) return 'initiative_overview';
    if (lower.includes('dok') || lower.includes('insight')) return 'dok3';
    if (lower.includes('knowledge')) return 'dok2';
    if (lower.includes('evidence') || lower.includes('fact')) return 'dok1';
    if (lower.includes('expert') || lower.includes('advisor')) return 'expert_council';
    return 'general';
  };

  const formatResponseForDisplay = (response: LLMResponse): string => {
    if (response.content) {
      return response.content;
    }
    if (response.items && response.items.length > 0) {
      return `I've created ${response.items.length} new item(s) for your outline.`;
    }
    if (response.citations && response.citations.length > 0) {
      return `I found ${response.citations.length} relevant source(s) for your research.`;
    }
    return 'Action completed successfully.';
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/80 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Context Bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex gap-1">
            <button
              onClick={() => setActionMode('create')}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-colors ${
                actionMode === 'create' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Plus className="w-3 h-3" />
              Create
            </button>
            <button
              onClick={() => setActionMode('edit')}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-colors ${
                actionMode === 'edit' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              disabled={!currentItem}
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={() => setActionMode('research')}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-colors ${
                actionMode === 'research' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Search className="w-3 h-3" />
              Research
            </button>
          </div>
        </div>
        {currentItem && (
          <div className="mt-1 text-xs text-gray-500 truncate">
            Editing: {currentItem.text}
          </div>
        )}
        {currentSection && (
          <div className="mt-1 text-xs text-gray-500">
            Section: {currentSection}
          </div>
        )}
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              How can I help you build your Brainlift?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              I can help you create SPOVs, edit content, or research information.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleSuggestionClick('Create an SPOV about customer retention')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="text-sm font-medium text-gray-700">Create an SPOV</div>
                <div className="text-xs text-gray-500">Start with a strategic point of view</div>
              </button>
              <button
                onClick={() => handleSuggestionClick('Help me write a clear purpose statement')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="text-sm font-medium text-gray-700">Define Purpose</div>
                <div className="text-xs text-gray-500">Clarify your decision or problem</div>
              </button>
              <button
                onClick={() => handleSuggestionClick('Research market trends for SaaS pricing')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="text-sm font-medium text-gray-700">Research</div>
                <div className="text-xs text-gray-500">Find evidence and citations</div>
              </button>
            </div>
          </div>
        ) : (
          <>
            {conversation.map((entry) => (
              <div
                key={entry.id}
                className={`flex ${entry.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    entry.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm">{entry.content}</div>
                  
                  {/* Show citations if present */}
                  {entry.response?.citations && (
                    <div className="mt-2 space-y-1">
                      {entry.response.citations.map((citation, idx) => (
                        <div key={idx} className="text-xs bg-white/10 rounded p-2">
                          <div>{citation.text}</div>
                          <div className="text-xs opacity-75 mt-1">— {citation.source}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show suggestions */}
                  {entry.response?.suggestions && (
                    <div className="mt-3 space-y-1">
                      {entry.response.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs text-left w-full px-2 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                        >
                          💡 {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={
              actionMode === 'create' 
                ? 'Ask me to create content...' 
                : actionMode === 'edit'
                ? 'How should I edit this?'
                : 'What would you like to research?'
            }
            className="flex-1 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LLMAssistantPanel;