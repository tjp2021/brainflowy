# Context Handoff - BrainFlowy Outline Editor

## Current State Summary

### What We Just Fixed
1. **Brainlift Template ID Issue** - Template IDs weren't matching the pattern for new items
   - Created centralized ID generator: `/frontend/src/utils/idGenerator.ts`
   - Fixed all components to use consistent 13-digit IDs

2. **LLM Persistence Bug** - LLM-created child items weren't persisting
   - Root cause: ID mismatch (LLM was creating `item_timestamp_idx_random` format)
   - Solution: All IDs now use `generateNewItemId()` for consistency

### The Next Major Issue to Fix

**INEFFICIENT FULL OUTLINE REFRESH ON EVERY OPERATION**

Currently, editing ONE bullet point causes:
1. Entire outline passed to `handleItemsChange`
2. Fetches ALL backend items
3. Compares EVERYTHING
4. Re-renders ENTIRE outline

This is terrible for performance and UX. We need surgical updates.

## Key Files to Review

### Frontend Core Components
- `/frontend/src/components/OutlineView.tsx` - Main container, handles persistence (has the problematic `handleItemsChange`)
- `/frontend/src/components/OutlineDesktop.tsx` - Desktop UI, handles LLM integration
- `/frontend/src/components/OutlineMobile.tsx` - Mobile UI
- `/frontend/src/components/LLMAssistantPanel.tsx` - LLM panel for create/edit operations

### Critical Functions
- `handleItemsChange` in OutlineView.tsx (line 72) - The inefficient function that needs replacing
- `handleLLMAction` in OutlineDesktop.tsx (line ~930) - How LLM operations are processed

### Backend API
- `/backend/app/api/endpoints/outlines.py` - Has batch operations we added but aren't using
- `/backend/app/models/outline.py` - Data models

### Frontend API Layer  
- `/frontend/src/services/api/realApi.ts` - Real API client
- `/frontend/src/services/api/mockOutlines.ts` - Mock API for development

### The Plan (Already Created)
- `/Users/timothyjoo/brainflowy/SURGICAL_UPDATE_PLAN.md` - Detailed plan for fixing the inefficiency

## Current Architecture Problems

1. **Every operation is O(n)** - Single item edit processes entire outline
2. **Complex diffing logic** - Comparing frontend vs backend states
3. **Poor UX** - Visible flickering on updates
4. **Wasteful API calls** - Multiple calls for simple operations

## What Needs to Be Done

### Phase 1: Create Surgical Handlers
Instead of `handleItemsChange(entireOutline)`, we need:
- `handleCreateItem(parentId, text)` - Create single item
- `handleUpdateItem(itemId, updates)` - Update single item  
- `handleDeleteItem(itemId)` - Delete single item
- `handleLLMCreate(parentId, items)` - LLM bulk create
- `handleLLMEdit(itemId, text, children)` - LLM structural edit

### Phase 2: Update Components
- Modify OutlineDesktop to call surgical handlers instead of passing entire outline
- Same for OutlineMobile
- Update LLM integration to use new handlers

### Phase 3: Test Everything
Critical to test:
- Manual edit → Refresh → Persisted
- LLM Create → Refresh → Persisted
- LLM Edit with children → Refresh → Structure persisted
- Templates still work

## Database Setup
- Using Azure Cosmos DB (credentials in `/backend/.env`)
- Mock API available for development (set `VITE_ENABLE_MOCK_API=true`)

## Running the Application

```bash
# Backend (already running in bash_25)
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Frontend (already running in bash_27)
npm run dev:frontend
```

## Recent Commits

1. **Fix Brainlift template creation** - Fixed ID generation pattern
2. **Fix LLM persistence** - Centralized ID generation

## Testing Priorities

1. **Persistence is CRITICAL** - User emphasized this multiple times
2. Test after EVERY change that edits persist after refresh
3. LLM operations must work correctly (Create and Edit)
4. Mobile and Desktop must behave identically

## User Preferences

- Wants surgical fixes, not band-aids
- Emphasizes thorough testing
- Frontend and backend state must be perfectly synchronized
- Dislikes unnecessary full refreshes (current issue)
- Wants careful analysis before implementation

## Next Steps

1. Review the SURGICAL_UPDATE_PLAN.md
2. Implement the surgical handlers in OutlineView.tsx
3. Update OutlineDesktop.tsx to use new handlers
4. Test each operation type thoroughly
5. Remove the old inefficient system

## Important Context

- The app is a hierarchical outline editor (like Notion/Workflowy)
- Supports LLM assistance for creating/editing content
- Has templates (like Brainlift) for structured documents
- Mobile and Desktop views share the same data
- Persistence to Azure Cosmos DB is essential

## Known Issues

1. Full outline refresh on every operation (main issue to fix)
2. TypeScript errors in build (app runs in dev mode)
3. Some test files have issues but core app works

The main goal is to make single-item operations efficient without breaking persistence or LLM functionality.