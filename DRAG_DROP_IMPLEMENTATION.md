# Drag & Drop Implementation Progress

## Current Status
We are implementing **Notion-style drag & drop** functionality for the BrainFlowy outlining application following **Test-Driven Development (TDD)** principles.

## Philosophy & Approach

### Why Notion-style?
- **Familiarity**: Notion is widely used; users already know these patterns
- **Proven UX**: Their drag & drop is intuitive and well-tested
- **Hierarchical support**: Handles nested structures elegantly
- **Visual clarity**: Clear indicators of what will happen

### Why TDD?
1. **Define behavior first**: Write tests that describe exactly how drag & drop should work
2. **Red-Green-Refactor cycle**: 
   - Red: Write failing tests
   - Green: Implement minimal code to pass
   - Refactor: Clean up and optimize
3. **Regression prevention**: Tests ensure we don't break functionality as we add features
4. **Documentation**: Tests serve as living documentation of expected behavior

## Completed So Far

### ✅ Search & Filter Feature
- Real-time filtering with highlighting
- Case-insensitive search
- All tests passing

### ✅ Keyboard Shortcuts
- Cmd/Ctrl+B: Bold/header style
- Cmd/Ctrl+I: Italic/quote style  
- Cmd/Ctrl+E: Code style
- Cmd/Ctrl+A: Select all
- Delete: Remove selected items
- Cmd+Z/Shift+Z: Undo/Redo

### ✅ Drag & Drop Foundation
- Installed @dnd-kit libraries (modern, accessible)
- Created comprehensive Notion-style tests
- Started component structure

## Notion Drag & Drop Specification

### Key Patterns We're Implementing:

1. **Drag Handle (⋮⋮)**
   - Hidden by default
   - Appears on row hover
   - Only draggable via handle

2. **Drop Indicators**
   - Blue horizontal line shows exact drop position
   - Line indentation shows hierarchy level
   - Updates in real-time as you drag

3. **Hierarchy Rules**
   - **Same level**: Drag vertically aligned
   - **Make child**: Drag 24-40px to the right
   - **Outdent**: Drag to the left

4. **Visual Feedback**
   - Dragged item: 50% opacity
   - Ghost placeholder at original position
   - Drop zone highlights

5. **Complex Behaviors**
   - Parent drags with all children
   - Auto-expand collapsed items on hover (500ms)
   - Prevent circular dependencies
   - Multi-select drag support

## Next Implementation Steps

### Phase 1: Basic Drag Infrastructure ⬅️ NEXT
```javascript
// 1. Add drag state to OutlineDesktop
const [activeId, setActiveId] = useState(null);
const [overId, setOverId] = useState(null);

// 2. Wrap items in DndContext
<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
  <SortableContext items={outline}>
    {renderItems()}
  </SortableContext>
</DndContext>

// 3. Create SortableItem component with drag handle
```

### Phase 2: Visual Feedback
- Drag handle with GripVertical icon
- Opacity changes during drag
- Drop indicator line (blue, 2px)
- Ghost/placeholder element

### Phase 3: Reordering Logic
- Calculate drop position based on cursor
- Handle same-level reordering
- Update data structure
- Persist to backend

### Phase 4: Hierarchy Manipulation  
- Detect X-position for indent/outdent
- Update parent-child relationships
- Maintain level consistency
- Handle edge cases

### Phase 5: Advanced Features
- Multi-select drag
- Auto-expand on hover
- Keyboard support
- Undo/Redo integration

## Test Files Created

1. `tests/tdd-drag-drop.spec.ts` - Basic drag & drop tests
2. `tests/tdd-notion-drag-drop.spec.ts` - Comprehensive Notion-style tests
3. `test-notion-drag-simple.js` - Manual testing script

## Current Test Status
- Most tests failing (expected - Red phase of TDD)
- Need to implement drag handles first
- Then visual feedback
- Then reordering logic

## Technical Decisions

### Why @dnd-kit?
- Modern React library
- Accessibility built-in
- Touch support
- Sortable lists support
- Better performance than react-beautiful-dnd

### Data Structure Considerations
```typescript
interface OutlineItem {
  id: string;
  text: string;
  level: number;
  parentId?: string;
  children: OutlineItem[];
  // ... other fields
}
```

### Drag State Management
- Use DndContext at OutlineDesktop level
- Track activeId (dragging item)
- Track overId (potential drop target)
- Calculate drop position from mouse coordinates

## Important Implementation Notes

1. **Handle-only dragging**: Text should remain selectable; only drag via handle
2. **Preserve selection**: Multi-select should work with drag
3. **Smooth animations**: Use CSS transitions for drop
4. **Accessibility**: Keyboard navigation must work
5. **Performance**: Large outlines should remain responsive

## Commands for Next Session

```bash
# Run tests to see current state
npx playwright test tests/tdd-notion-drag-drop.spec.ts

# Or manual test
node test-notion-drag-simple.js

# Watch for changes
cd frontend && npm run dev
```

## Session Handoff Notes

**For next session:**
1. Start by implementing drag handles that appear on hover
2. Use the SortableItem pattern from @dnd-kit docs
3. Follow the tests in `tdd-notion-drag-drop.spec.ts`
4. Focus on getting one test passing at a time
5. Keep the Notion UX patterns as the north star

**Current blockers:**
- None, ready to implement

**Key files to modify:**
- `/frontend/src/components/OutlineDesktop.tsx` - Main component
- `/frontend/src/components/DraggableOutlineItem.tsx` - Started but needs completion

The foundation is laid, tests are written, and we're ready for implementation!