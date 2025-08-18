# 🧪 BrainFlowy Manual Testing Checklist

## 🚀 Servers Running
- **Backend**: http://localhost:8001 (API)
- **Frontend**: http://localhost:5174 (Web App)
- **API Docs**: http://localhost:8001/docs

---

## 📋 CRITICAL USER JOURNEY TEST

### 1. User Registration & Login
- [ ] Open http://localhost:5174
- [ ] Click "Register" 
- [ ] Enter email, password, display name
- [ ] Verify registration succeeds
- [ ] Verify auto-login after registration
- [ ] Click "Logout" (should go to home `/`, not `/login`)
- [ ] Click "Login"
- [ ] Enter same credentials
- [ ] Verify login succeeds

### 2. Create & Edit Items (MOST IMPORTANT TEST)
- [ ] Click "Create New Outline" or select existing
- [ ] Click "Add new item" button
- [ ] **CRITICAL**: Verify "New item" placeholder appears
- [ ] Click on the text field
- [ ] **CRITICAL**: Verify "New item" text clears when you click
- [ ] Type "My first item"
- [ ] Press Enter
- [ ] **CRITICAL**: Verify item saves and appears in list
- [ ] Click on the item to edit
- [ ] Change text to "Edited item"
- [ ] Press Enter
- [ ] Verify edit persists

### 3. Test Hierarchy (Parent/Child)
- [ ] Create a parent item
- [ ] Create another item below it
- [ ] Press Tab to indent (make it a child)
- [ ] Verify indentation shows visually
- [ ] Press Shift+Tab to outdent
- [ ] Verify it becomes sibling again

### 4. Test Styles
- [ ] Select an item
- [ ] Press Cmd/Ctrl + H (Header style)
- [ ] Verify style changes to header (larger, bold)
- [ ] Press Cmd/Ctrl + E (Code style)
- [ ] Verify style changes to code (monospace, background)
- [ ] Press Cmd/Ctrl + Q (Quote style)
- [ ] Verify style changes to quote (italic, indented)
- [ ] Press Cmd/Ctrl + N (Normal style)
- [ ] Verify returns to normal

### 5. Test Style Persistence ⭐
- [ ] Create items with different styles
- [ ] **CRITICAL**: Refresh the page (F5)
- [ ] Verify all styles are still applied
- [ ] Logout
- [ ] Login again
- [ ] Verify styles persist across sessions

### 6. Test Voice Input (Optional)
- [ ] Click microphone button
- [ ] Record a voice note
- [ ] Click "Stop Recording"
- [ ] Verify transcription appears
- [ ] Click "Accept Structure"
- [ ] Verify items are added to outline

### 7. Test Mobile View
- [ ] Open browser DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select iPhone or mobile device
- [ ] Verify mobile layout appears
- [ ] Test these mobile gestures:
  - [ ] Swipe right on item (should indent)
  - [ ] Swipe left on item (should outdent)
  - [ ] Long press item (expand/collapse)
  - [ ] Double tap item (cycle styles)

### 8. Test Empty Item Handling
- [ ] Click "Add new item"
- [ ] Don't type anything (leave as "New item")
- [ ] Press Enter
- [ ] **CRITICAL**: Verify empty item is removed/not saved

### 9. Test Multiple Outlines
- [ ] Create "Outline A" with items
- [ ] Create "Outline B" with different items
- [ ] Switch between outlines using sidebar
- [ ] Verify each maintains its own items

### 10. Data Persistence Check 🔴
- [ ] Create several items with styles
- [ ] Note the exact content and styles
- [ ] **Stop the backend server** (Ctrl+C in terminal)
- [ ] **Restart backend server**
- [ ] Refresh the page
- [ ] Login again
- [ ] **CRITICAL**: Check if items are gone (they likely will be with mock DB)

---

## ⚠️ Expected Issues with Mock Database

Since we're using MockCosmosDB (in-memory), expect:
- ❌ Data lost when backend restarts
- ❌ No sharing between different browser sessions
- ❌ No real persistence

## 🐛 What to Look For

### Good Signs ✅
- Items save immediately when pressing Enter
- Styles apply instantly
- No duplicate items appearing
- Smooth editing experience
- No console errors in browser DevTools

### Bad Signs ❌
- "New item" text doesn't clear when clicked
- Items disappear after creation
- Styles don't persist on refresh
- Login redirects to wrong page
- Network errors in console

---

## 📊 Browser DevTools Checks

1. Open DevTools Console (F12)
2. Look for:
   - Red errors
   - Failed API calls (404, 500)
   - "Creating new item in backend:" logs
   - "Item created successfully:" logs

---

## 🎯 Quick Smoke Test (2 minutes)

If short on time, just test these critical paths:
1. Register → Create outline → Add item → Refresh → Item still there?
2. Add item with style → Refresh → Style still there?
3. Edit item → Refresh → Edit persisted?

---

**Remember**: The mock database means data only persists while the backend is running. For production, you'll need real Cosmos DB or another persistent database.