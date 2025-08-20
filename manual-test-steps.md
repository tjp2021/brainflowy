# Manual Test for Hierarchy Persistence

## Test Steps:

1. **Open the app**: http://localhost:5174

2. **Register a new user**:
   - Email: test_hierarchy@example.com  
   - Password: TestPass123!
   - Name: Hierarchy Test

3. **Create nested hierarchy**:
   - Type: "MAIN TASK"
   - Press Enter
   - Press Tab (to indent)
   - Type: "Sub-task 1.1"
   - Press Enter
   - Type: "Sub-task 1.2"
   - Press Enter
   - Press Tab (to indent further)
   - Type: "Sub-sub-task 1.2.1"
   - Press Enter
   - Type: "Sub-sub-task 1.2.2"
   - Press Enter
   - Press Shift+Tab (to outdent)
   - Type: "Sub-task 1.3"

4. **Wait 2 seconds** for auto-save

5. **Logout** (click Logout button)

6. **Login again** with same credentials

7. **Verify hierarchy**:
   - MAIN TASK should be visible
   - Sub-task 1.1 should be indented under MAIN TASK
   - Sub-task 1.2 should be indented under MAIN TASK
   - Sub-sub-task 1.2.1 should be double-indented under Sub-task 1.2
   - Sub-sub-task 1.2.2 should be double-indented under Sub-task 1.2
   - Sub-task 1.3 should be indented under MAIN TASK

## What was fixed:

The frontend was not properly converting nested items from the backend. The `expanded` field was not being set when loading items, so children were never displayed. 

Now when items are loaded from the backend, they are:
1. Recursively converted to include all nested children
2. Set with `expanded: true` by default so all items are visible
3. Properly displayed in the hierarchical structure