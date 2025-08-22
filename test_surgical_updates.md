# Test Plan for Surgical Updates

## Manual Test Scenarios

### 1. Text Edit Test
- [ ] Edit an existing item's text
- [ ] Verify only that item updates (no flickering)
- [ ] Refresh page - text should persist

### 2. Create Item Test  
- [ ] Create a new item (press Enter)
- [ ] Verify only new item appears
- [ ] Refresh page - new item should persist

### 3. Delete Item Test
- [ ] Select item(s) and press Delete
- [ ] Verify only selected items disappear
- [ ] Refresh page - deleted items should stay deleted

### 4. LLM Create Test
- [ ] Use LLM to create new content
- [ ] Verify items appear without full refresh
- [ ] Refresh page - LLM items should persist

### 5. LLM Edit Test
- [ ] Use LLM to edit existing item
- [ ] Verify only that item updates
- [ ] Refresh page - edits should persist

### 6. LLM Edit with Children Test
- [ ] Use LLM to edit item and add children
- [ ] Verify structure updates correctly
- [ ] Refresh page - new structure should persist

## Expected Improvements
- No full outline flicker on updates
- Faster response times
- Smooth UX during edits
- Proper persistence of all operations

## Console Checks
- No errors about updating entire outline
- Surgical update logs should show single item operations
- Backend calls should be minimal (1 per operation)