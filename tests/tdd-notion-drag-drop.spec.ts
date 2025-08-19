import { test, expect } from '@playwright/test';

test.describe('TDD: Notion-style Drag & Drop', () => {
  
  test.beforeEach(async ({ page }) => {
    // Register and login
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    await page.goto('http://localhost:5176');
    await page.click('text=Sign up');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/outlines/, { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test.describe('Drag Handle Behavior', () => {
    test('Drag handle appears on hover', async ({ page }) => {
      // Create an item
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Test Item');
      await page.keyboard.press('Escape');
      
      // Initially no visible drag handle
      const dragHandle = page.locator('[data-drag-handle], .drag-handle').first();
      await expect(dragHandle).toHaveCSS('opacity', '0');
      
      // Hover over the item
      const item = page.locator('.group:has-text("Test Item")').first();
      await item.hover();
      
      // Drag handle should become visible
      await expect(dragHandle).toHaveCSS('opacity', /0\.[5-9]|1/); // opacity > 0
    });

    test('Can only drag via handle, not text', async ({ page }) => {
      // Create items
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Item 1');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Item 2');
      await page.keyboard.press('Escape');
      
      // Try to drag by clicking on text (should not work)
      const item1Text = page.locator('div:has-text("Item 1")').last(); // Get the text div
      await item1Text.hover();
      await page.mouse.down();
      await page.mouse.move(0, 100);
      await page.mouse.up();
      
      // Order should remain unchanged
      const items = page.locator('.outline-desktop-content .group');
      await expect(items.nth(0)).toContainText('Item 1');
      await expect(items.nth(1)).toContainText('Item 2');
    });
  });

  test.describe('Drop Indicators', () => {
    test('Blue line appears between items when dragging', async ({ page }) => {
      // Create items
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Item A');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Item B');
      await page.keyboard.press('Escape');
      
      // Start dragging Item A
      const itemA = page.locator('.group:has-text("Item A")').first();
      await itemA.hover();
      const dragHandle = itemA.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      
      // Move below Item B
      const itemB = page.locator('.group:has-text("Item B")').first();
      const itemBBox = await itemB.boundingBox();
      await page.mouse.move(itemBBox!.x, itemBBox!.y + itemBBox!.height);
      
      // Check for drop indicator line
      const dropLine = page.locator('.drop-indicator, .drop-line, [data-drop-indicator]');
      await expect(dropLine).toBeVisible();
      await expect(dropLine).toHaveCSS('background-color', /blue|rgb\(.*147.*197.*253.*\)/); // blue color
      
      await page.mouse.up();
    });

    test('Drop line indent shows hierarchy level', async ({ page }) => {
      // Create parent item
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Parent');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Item to nest');
      await page.keyboard.press('Escape');
      
      // Start dragging the second item
      const item = page.locator('.group:has-text("Item to nest")').first();
      await item.hover();
      const dragHandle = item.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      
      // Move to the right of parent (to make it a child)
      const parent = page.locator('.group:has-text("Parent")').first();
      const parentBox = await parent.boundingBox();
      await page.mouse.move(parentBox!.x + 40, parentBox!.y + parentBox!.height);
      
      // Check drop line is indented
      const dropLine = page.locator('.drop-indicator, .drop-line, [data-drop-indicator]');
      const dropLineBox = await dropLine.boundingBox();
      
      // Drop line should be indented (further from left edge)
      expect(dropLineBox!.x).toBeGreaterThan(parentBox!.x + 20);
      
      await page.mouse.up();
    });
  });

  test.describe('Hierarchy Manipulation', () => {
    test('Make item a child by dragging right', async ({ page }) => {
      // Create two items
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Parent');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('To Be Child');
      await page.keyboard.press('Escape');
      
      const child = page.locator('.group:has-text("To Be Child")').first();
      const parent = page.locator('.group:has-text("Parent")').first();
      
      // Get initial padding
      const initialPadding = await child.evaluate(el => 
        parseInt(window.getComputedStyle(el).paddingLeft)
      );
      
      // Drag child to the right of parent position
      await child.hover();
      const dragHandle = child.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      
      const parentBox = await parent.boundingBox();
      await page.mouse.move(parentBox!.x + 40, parentBox!.y + parentBox!.height);
      await page.mouse.up();
      
      // Check child is now indented
      const newPadding = await child.evaluate(el => 
        parseInt(window.getComputedStyle(el).paddingLeft)
      );
      
      expect(newPadding).toBeGreaterThan(initialPadding);
    });

    test('Outdent child by dragging left', async ({ page }) => {
      // Create parent with child
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Parent');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Child');
      await page.keyboard.press('Tab'); // Make it a child
      await page.keyboard.press('Escape');
      
      const child = page.locator('.group:has-text("Child")').first();
      
      // Get initial padding (should be indented)
      const initialPadding = await child.evaluate(el => 
        parseInt(window.getComputedStyle(el).paddingLeft)
      );
      
      // Drag child to the left
      await child.hover();
      const dragHandle = child.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      
      const childBox = await child.boundingBox();
      await page.mouse.move(childBox!.x - 40, childBox!.y);
      await page.mouse.up();
      
      // Check child is now at root level
      const newPadding = await child.evaluate(el => 
        parseInt(window.getComputedStyle(el).paddingLeft)
      );
      
      expect(newPadding).toBeLessThan(initialPadding);
    });

    test('Reorder siblings at same level', async ({ page }) => {
      // Create three siblings
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Item A');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Item B');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Item C');
      await page.keyboard.press('Escape');
      
      // Drag Item A below Item B (keeping same indent level)
      const itemA = page.locator('.group:has-text("Item A")').first();
      const itemB = page.locator('.group:has-text("Item B")').first();
      
      await itemA.hover();
      const dragHandle = itemA.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      
      const itemBBox = await itemB.boundingBox();
      // Keep same X position to maintain level
      await page.mouse.move(itemBBox!.x, itemBBox!.y + itemBBox!.height);
      await page.mouse.up();
      
      // Verify new order: B, A, C
      const items = page.locator('.outline-desktop-content .group');
      await expect(items.nth(0)).toContainText('Item B');
      await expect(items.nth(1)).toContainText('Item A');
      await expect(items.nth(2)).toContainText('Item C');
    });
  });

  test.describe('Visual Feedback', () => {
    test('Dragged item becomes semi-transparent', async ({ page }) => {
      // Create item
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Draggable');
      await page.keyboard.press('Escape');
      
      const item = page.locator('.group:has-text("Draggable")').first();
      
      // Check initial opacity
      const initialOpacity = await item.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      expect(parseFloat(initialOpacity)).toBe(1);
      
      // Start dragging
      await item.hover();
      const dragHandle = item.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      await page.mouse.move(100, 100);
      
      // Check opacity during drag
      const dragOpacity = await item.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      expect(parseFloat(dragOpacity)).toBeLessThan(0.7);
      expect(parseFloat(dragOpacity)).toBeGreaterThan(0.3);
      
      await page.mouse.up();
    });

    test('Ghost placeholder remains at original position', async ({ page }) => {
      // Create items
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Item 1');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Item 2');
      await page.keyboard.press('Escape');
      
      const item1 = page.locator('.group:has-text("Item 1")').first();
      
      // Start dragging
      await item1.hover();
      const dragHandle = item1.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      await page.mouse.move(100, 200);
      
      // Check for placeholder/ghost element
      const placeholder = page.locator('.placeholder, .ghost, [data-placeholder]');
      await expect(placeholder).toBeVisible();
      
      await page.mouse.up();
    });
  });

  test.describe('Complex Behaviors', () => {
    test('Parent with children moves entire branch', async ({ page }) => {
      // Create parent with children
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Parent');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Child 1');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Child 2');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Sibling');
      await page.keyboard.press('Shift+Tab'); // Outdent back to root
      await page.keyboard.press('Escape');
      
      // Drag parent below sibling
      const parent = page.locator('.group:has-text("Parent")').first();
      const sibling = page.locator('.group:has-text("Sibling")').first();
      
      await parent.hover();
      const dragHandle = parent.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      
      const siblingBox = await sibling.boundingBox();
      await page.mouse.move(siblingBox!.x, siblingBox!.y + siblingBox!.height);
      await page.mouse.up();
      
      // Verify order: Sibling, Parent, Child 1, Child 2
      const items = page.locator('.outline-desktop-content .group');
      await expect(items.nth(0)).toContainText('Sibling');
      await expect(items.nth(1)).toContainText('Parent');
      await expect(items.nth(2)).toContainText('Child 1');
      await expect(items.nth(3)).toContainText('Child 2');
      
      // Verify children are still indented under parent
      const child1 = page.locator('.group:has-text("Child 1")').first();
      const child1Padding = await child1.evaluate(el => 
        parseInt(window.getComputedStyle(el).paddingLeft)
      );
      const parentPadding = await parent.evaluate(el => 
        parseInt(window.getComputedStyle(el).paddingLeft)
      );
      expect(child1Padding).toBeGreaterThan(parentPadding);
    });

    test('Cannot drop item into itself', async ({ page }) => {
      // Create parent with child
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Parent');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Child');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Escape');
      
      const parent = page.locator('.group:has-text("Parent")').first();
      const child = page.locator('.group:has-text("Child")').first();
      
      // Try to drag parent into its child
      await parent.hover();
      const dragHandle = parent.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      
      const childBox = await child.boundingBox();
      await page.mouse.move(childBox!.x + 40, childBox!.y);
      await page.mouse.up();
      
      // Parent should still be at root level
      const parentPadding = await parent.evaluate(el => 
        parseInt(window.getComputedStyle(el).paddingLeft)
      );
      
      // Parent should not have become a child
      expect(parentPadding).toBeLessThan(30);
    });

    test('Auto-expand collapsed parent on hover', async ({ page }) => {
      // Create parent with children
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Collapsed Parent');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Hidden Child');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Item to Drop');
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Escape');
      
      // Collapse the parent
      const parent = page.locator('.group:has-text("Collapsed Parent")').first();
      const expandButton = parent.locator('button:has([data-lucide="chevron-down"]), button:has([data-lucide="chevron-right"])').first();
      await expandButton.click();
      
      // Verify child is hidden
      await expect(page.locator('text=Hidden Child')).not.toBeVisible();
      
      // Start dragging another item
      const itemToDrop = page.locator('.group:has-text("Item to Drop")').first();
      await itemToDrop.hover();
      const dragHandle = itemToDrop.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      
      // Hover over collapsed parent for 600ms
      await parent.hover();
      await page.waitForTimeout(600);
      
      // Parent should auto-expand
      await expect(page.locator('text=Hidden Child')).toBeVisible();
      
      await page.mouse.up();
    });
  });

  test.describe('Keyboard Support', () => {
    test('Escape cancels drag operation', async ({ page }) => {
      // Create items
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill('Item A');
      await page.keyboard.press('Enter');
      await page.locator('textarea').fill('Item B');
      await page.keyboard.press('Escape');
      
      // Start dragging
      const itemA = page.locator('.group:has-text("Item A")').first();
      await itemA.hover();
      const dragHandle = itemA.locator('[data-drag-handle], .drag-handle').first();
      await dragHandle.hover();
      await page.mouse.down();
      
      // Move to new position
      await page.mouse.move(100, 200);
      
      // Press Escape to cancel
      await page.keyboard.press('Escape');
      
      // Items should remain in original order
      const items = page.locator('.outline-desktop-content .group');
      await expect(items.nth(0)).toContainText('Item A');
      await expect(items.nth(1)).toContainText('Item B');
    });
  });
});