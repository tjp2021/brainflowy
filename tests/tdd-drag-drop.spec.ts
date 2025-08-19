import { test, expect } from '@playwright/test';

test.describe('TDD: Drag & Drop Functionality', () => {
  
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

  test('Items should have drag handles', async ({ page }) => {
    // Create test items
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Item 1');
    await page.keyboard.press('Enter');
    await page.locator('textarea').fill('Item 2');
    await page.keyboard.press('Escape');
    
    // Check for drag handles
    const dragHandles = page.locator('[data-drag-handle], .drag-handle, [draggable="true"]');
    await expect(dragHandles).toHaveCount(2);
  });

  test('Drag item to reorder at same level', async ({ page }) => {
    // Create three items at same level
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Item A');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Item B');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Item C');
    await page.keyboard.press('Escape');
    
    // Find items
    const itemA = page.locator('div:has-text("Item A")').first();
    const itemB = page.locator('div:has-text("Item B")').first();
    const itemC = page.locator('div:has-text("Item C")').first();
    
    // Get initial positions
    const initialAPos = await itemA.boundingBox();
    const initialBPos = await itemB.boundingBox();
    
    // Drag Item A below Item B
    await itemA.hover();
    await page.mouse.down();
    await itemB.hover();
    await page.mouse.move(initialBPos!.x, initialBPos!.y + initialBPos!.height + 5);
    await page.mouse.up();
    
    // Verify new order: B, A, C
    const items = page.locator('.outline-desktop-content .group');
    await expect(items.nth(0)).toContainText('Item B');
    await expect(items.nth(1)).toContainText('Item A');
    await expect(items.nth(2)).toContainText('Item C');
  });

  test('Drag shows visual feedback', async ({ page }) => {
    // Create items
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Draggable Item');
    await page.keyboard.press('Escape');
    
    const item = page.locator('div:has-text("Draggable Item")').first();
    
    // Start dragging
    await item.hover();
    await page.mouse.down();
    
    // Check for visual feedback (dragging state)
    const draggingIndicator = page.locator('.dragging, [data-dragging="true"], .opacity-50');
    await expect(draggingIndicator).toBeVisible();
    
    await page.mouse.up();
  });

  test('Drop zones appear when dragging', async ({ page }) => {
    // Create items
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Item 1');
    await page.keyboard.press('Enter');
    await page.locator('textarea').fill('Item 2');
    await page.keyboard.press('Escape');
    
    const item1 = page.locator('div:has-text("Item 1")').first();
    
    // Start dragging
    await item1.hover();
    await page.mouse.down();
    
    // Check for drop zones
    const dropZones = page.locator('.drop-zone, [data-drop-zone], .border-dashed');
    await expect(dropZones.first()).toBeVisible();
    
    await page.mouse.up();
  });

  test('Drag item to make it a child (indent)', async ({ page }) => {
    // Create two items
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Parent Item');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Child Item');
    await page.keyboard.press('Escape');
    
    const parentItem = page.locator('div:has-text("Parent Item")').first();
    const childItem = page.locator('div:has-text("Child Item")').first();
    
    // Get initial padding of child
    const initialPadding = await childItem.evaluate(el => 
      window.getComputedStyle(el).paddingLeft
    );
    
    // Drag child onto parent (with right offset to indicate nesting)
    await childItem.hover();
    await page.mouse.down();
    const parentBox = await parentItem.boundingBox();
    await page.mouse.move(parentBox!.x + 50, parentBox!.y + parentBox!.height / 2);
    await page.mouse.up();
    
    // Verify child is now indented
    const newPadding = await childItem.evaluate(el => 
      window.getComputedStyle(el).paddingLeft
    );
    
    expect(parseInt(newPadding)).toBeGreaterThan(parseInt(initialPadding));
  });

  test('Drag child out to root level (outdent)', async ({ page }) => {
    // Create parent with child
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Parent Item');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Child Item');
    await page.keyboard.press('Tab'); // Indent to make it a child
    await page.keyboard.press('Escape');
    
    const childItem = page.locator('div:has-text("Child Item")').first();
    
    // Get initial padding (should be indented)
    const initialPadding = await childItem.evaluate(el => 
      window.getComputedStyle(el).paddingLeft
    );
    
    // Drag child to the left to outdent
    await childItem.hover();
    await page.mouse.down();
    const childBox = await childItem.boundingBox();
    await page.mouse.move(childBox!.x - 50, childBox!.y);
    await page.mouse.up();
    
    // Verify child is now at root level
    const newPadding = await childItem.evaluate(el => 
      window.getComputedStyle(el).paddingLeft
    );
    
    expect(parseInt(newPadding)).toBeLessThan(parseInt(initialPadding));
  });

  test('Cannot drag item into itself', async ({ page }) => {
    // Create parent with children
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Parent Item');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Child 1');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Child 2');
    await page.keyboard.press('Escape');
    
    const parentItem = page.locator('div:has-text("Parent Item")').first();
    const child1 = page.locator('div:has-text("Child 1")').first();
    
    // Try to drag parent into its own child
    await parentItem.hover();
    await page.mouse.down();
    await child1.hover();
    await page.mouse.up();
    
    // Parent should still be at root level
    const parentPadding = await parentItem.evaluate(el => 
      window.getComputedStyle(el).paddingLeft
    );
    
    // Should have minimal padding (root level)
    expect(parseInt(parentPadding)).toBeLessThan(30);
  });

  test('Drag multiple selected items together', async ({ page }) => {
    // Create items
    for (let i = 1; i <= 4; i++) {
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill(`Item ${i}`);
      await page.keyboard.press('Enter');
    }
    await page.keyboard.press('Escape');
    
    // Select items 2 and 3
    const isMac = process.platform === 'darwin';
    await page.click('text=Item 2', { modifiers: [isMac ? 'Meta' : 'Control'] });
    await page.click('text=Item 3', { modifiers: [isMac ? 'Meta' : 'Control'] });
    
    // Drag the selected items below Item 4
    const item2 = page.locator('div:has-text("Item 2")').first();
    const item4 = page.locator('div:has-text("Item 4")').first();
    
    await item2.hover();
    await page.mouse.down();
    const item4Box = await item4.boundingBox();
    await page.mouse.move(item4Box!.x, item4Box!.y + item4Box!.height + 5);
    await page.mouse.up();
    
    // Verify new order: 1, 4, 2, 3
    const items = page.locator('.outline-desktop-content .group');
    await expect(items.nth(0)).toContainText('Item 1');
    await expect(items.nth(1)).toContainText('Item 4');
    await expect(items.nth(2)).toContainText('Item 2');
    await expect(items.nth(3)).toContainText('Item 3');
  });

  test('Undo/Redo works with drag operations', async ({ page }) => {
    // Create items
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Item A');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Item B');
    await page.keyboard.press('Escape');
    
    // Drag Item A below Item B
    const itemA = page.locator('div:has-text("Item A")').first();
    const itemB = page.locator('div:has-text("Item B")').first();
    
    await itemA.hover();
    await page.mouse.down();
    const itemBBox = await itemB.boundingBox();
    await page.mouse.move(itemBBox!.x, itemBBox!.y + itemBBox!.height + 5);
    await page.mouse.up();
    
    // Verify reorder happened
    const items = page.locator('.outline-desktop-content .group');
    await expect(items.nth(0)).toContainText('Item B');
    await expect(items.nth(1)).toContainText('Item A');
    
    // Undo
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+z' : 'Control+z');
    
    // Should be back to original order
    await expect(items.nth(0)).toContainText('Item A');
    await expect(items.nth(1)).toContainText('Item B');
    
    // Redo
    await page.keyboard.press(isMac ? 'Meta+Shift+z' : 'Control+Shift+z');
    
    // Should be reordered again
    await expect(items.nth(0)).toContainText('Item B');
    await expect(items.nth(1)).toContainText('Item A');
  });
});