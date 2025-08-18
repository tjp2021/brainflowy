# Test Plan: Item Creation and Editing Flow

## Test Scenarios

### 1. New Item Creation
- [ ] Click "Add new item" button
- [ ] Verify "New item" placeholder text appears
- [ ] Click on the text field to start editing
- [ ] Verify "New item" text is cleared and cursor is ready for typing
- [ ] Type some text
- [ ] Press Enter to save
- [ ] Verify item is saved to backend with correct content
- [ ] Verify frontend updates with backend ID

### 2. Empty Item Handling
- [ ] Create a new item
- [ ] Don't type anything (leave as "New item")
- [ ] Press Enter
- [ ] Verify the empty item is removed from the UI
- [ ] Verify no backend call is made for empty items

### 3. Edit Existing Item
- [ ] Click on an existing item
- [ ] Verify all text is selected for easy replacement
- [ ] Type new text
- [ ] Press Enter
- [ ] Verify item updates in backend

### 4. Style Changes
- [ ] Create a new item with header style selected
- [ ] Verify item is created with correct style
- [ ] Use Cmd+B/E/I to change styles
- [ ] Verify styles persist to backend

## Expected Behaviors

1. **Placeholder Text Clearing**:
   - When clicking on "New item", the text should clear immediately
   - Cursor should be ready for typing
   - No need to manually delete "New item" text

2. **Backend Synchronization**:
   - New items get temporary IDs (item_TIMESTAMP)
   - On save, backend returns permanent ID
   - Frontend updates local item with backend ID
   - No duplicate text or concatenation issues

3. **Empty Item Cleanup**:
   - Items with no text or just "New item" are removed
   - No ghost items left in the UI
   - No unnecessary backend calls

## Console Checks

Monitor browser console for:
1. "Creating new item in backend:" logs
2. "Item created successfully:" with backend response
3. No errors about missing content field
4. No duplicate API calls