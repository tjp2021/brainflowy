import { test, expect } from '@playwright/test';

test.describe('TDD: Enhanced Features - Drag & Drop', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Login and create some test items
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
  });

  test('Drag item to reorder within same level', async ({ page }) => {
    // Create three items
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Item A');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Item B');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Item C');
    await page.keyboard.press('Escape');
    
    // Drag Item A below Item B
    const itemA = page.locator('div:has-text("Item A")').first();
    const itemB = page.locator('div:has-text("Item B")').first();
    
    // Get drag handle for Item A
    const dragHandle = itemA.locator('.drag-handle, [data-drag-handle]').first();
    
    // Perform drag and drop
    await dragHandle.hover();
    await page.mouse.down();
    await itemB.hover();
    await page.mouse.move(0, 20, { steps: 5 }); // Move below Item B
    await page.mouse.up();
    
    // Verify new order: B, A, C
    const items = page.locator('.outline-desktop-content .group');
    await expect(items.nth(0)).toContainText('Item B');
    await expect(items.nth(1)).toContainText('Item A');
    await expect(items.nth(2)).toContainText('Item C');
  });

  test('Drag item to make it a child of another item', async ({ page }) => {
    // Create parent and sibling items
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Parent Item');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Sibling Item');
    await page.keyboard.press('Escape');
    
    // Drag Sibling to become child of Parent
    const sibling = page.locator('div:has-text("Sibling Item")').first();
    const parent = page.locator('div:has-text("Parent Item")').first();
    
    const dragHandle = sibling.locator('.drag-handle, [data-drag-handle]').first();
    
    await dragHandle.hover();
    await page.mouse.down();
    await parent.hover();
    await page.keyboard.down('Shift'); // Hold shift to make child
    await page.mouse.up();
    await page.keyboard.up('Shift');
    
    // Verify Sibling is now indented under Parent
    const siblingItem = page.locator('div:has-text("Sibling Item")').first();
    const parentItem = page.locator('div:has-text("Parent Item")').first();
    
    // Check indentation level
    const siblingPadding = await siblingItem.evaluate(el => 
      window.getComputedStyle(el).paddingLeft
    );
    const parentPadding = await parentItem.evaluate(el => 
      window.getComputedStyle(el).paddingLeft
    );
    
    expect(parseInt(siblingPadding)).toBeGreaterThan(parseInt(parentPadding));
  });

  test('Drag child item out to root level', async ({ page }) => {
    // Create parent with child
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Parent Item');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Child Item');
    await page.keyboard.press('Tab'); // Indent to make child
    await page.keyboard.press('Escape');
    
    // Drag child out to root level
    const child = page.locator('div:has-text("Child Item")').first();
    const dragHandle = child.locator('.drag-handle, [data-drag-handle]').first();
    
    await dragHandle.hover();
    await page.mouse.down();
    await page.mouse.move(-50, 0, { steps: 5 }); // Move left to outdent
    await page.mouse.up();
    
    // Verify child is now at root level
    const childItem = page.locator('div:has-text("Child Item")').first();
    const parentItem = page.locator('div:has-text("Parent Item")').first();
    
    const childPadding = await childItem.evaluate(el => 
      window.getComputedStyle(el).paddingLeft
    );
    const parentPadding = await parentItem.evaluate(el => 
      window.getComputedStyle(el).paddingLeft
    );
    
    expect(childPadding).toBe(parentPadding);
  });
});

test.describe('TDD: Enhanced Features - Search & Filter', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    // Create test items
    const items = [
      'JavaScript Tutorial',
      'Python Basics',
      'JavaScript Advanced',
      'Ruby Programming',
      'Python Data Science'
    ];
    
    for (const item of items) {
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill(item);
      await page.keyboard.press('Enter');
    }
    await page.keyboard.press('Escape');
  });

  test('Search filters items in real-time', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Search for "JavaScript"
    await searchInput.fill('JavaScript');
    
    // Should show only JavaScript items
    await expect(page.locator('text=JavaScript Tutorial')).toBeVisible();
    await expect(page.locator('text=JavaScript Advanced')).toBeVisible();
    
    // Should hide non-matching items
    await expect(page.locator('text=Python Basics')).not.toBeVisible();
    await expect(page.locator('text=Ruby Programming')).not.toBeVisible();
    await expect(page.locator('text=Python Data Science')).not.toBeVisible();
  });

  test('Search is case-insensitive', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Search with different case
    await searchInput.fill('PYTHON');
    
    // Should still find Python items
    await expect(page.locator('text=Python Basics')).toBeVisible();
    await expect(page.locator('text=Python Data Science')).toBeVisible();
  });

  test('Clear search shows all items again', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Filter items
    await searchInput.fill('JavaScript');
    await expect(page.locator('text=Python Basics')).not.toBeVisible();
    
    // Clear search
    await searchInput.clear();
    
    // All items should be visible again
    await expect(page.locator('text=JavaScript Tutorial')).toBeVisible();
    await expect(page.locator('text=Python Basics')).toBeVisible();
    await expect(page.locator('text=JavaScript Advanced')).toBeVisible();
    await expect(page.locator('text=Ruby Programming')).toBeVisible();
    await expect(page.locator('text=Python Data Science')).toBeVisible();
  });

  test('Search highlights matching text', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    await searchInput.fill('Python');
    
    // Check if matching text is highlighted
    const pythonItem = page.locator('text=Python Basics').first();
    const highlight = pythonItem.locator('mark, .highlight, .search-match');
    
    await expect(highlight).toBeVisible();
    await expect(highlight).toContainText('Python');
  });

  test('Search works with nested items', async ({ page }) => {
    // Create nested structure
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Parent with nested');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Nested child item');
    await page.keyboard.press('Tab'); // Indent
    await page.keyboard.press('Escape');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Search for nested
    await searchInput.fill('nested');
    
    // Both parent and child should be visible
    await expect(page.locator('text=Parent with nested')).toBeVisible();
    await expect(page.locator('text=Nested child item')).toBeVisible();
  });
});

test.describe('TDD: Enhanced Features - Keyboard Shortcuts', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
  });

  test('Cmd/Ctrl+B toggles bold/header style', async ({ page }) => {
    // Create item
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    await textarea.fill('Test text');
    
    // Apply bold with keyboard shortcut
    await page.keyboard.press('Meta+b'); // Cmd+B on Mac, Ctrl+B on Windows/Linux
    
    await page.keyboard.press('Enter');
    
    // Check if text has header/bold style
    const item = page.locator('div:has-text("Test text")').first();
    await expect(item).toHaveClass(/font-bold|text-base|text-lg/);
  });

  test('Cmd/Ctrl+I toggles italic/quote style', async ({ page }) => {
    // Create item
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    await textarea.fill('Quote text');
    
    // Apply italic with keyboard shortcut
    await page.keyboard.press('Meta+i');
    
    await page.keyboard.press('Enter');
    
    // Check if text has italic/quote style
    const item = page.locator('div:has-text("Quote text")').first();
    await expect(item).toHaveClass(/italic|border-l/);
  });

  test('Cmd/Ctrl+E toggles code style', async ({ page }) => {
    // Create item
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    await textarea.fill('const code = true');
    
    // Apply code style with keyboard shortcut
    await page.keyboard.press('Meta+e');
    
    await page.keyboard.press('Enter');
    
    // Check if text has code style
    const item = page.locator('div:has-text("const code = true")').first();
    await expect(item).toHaveClass(/font-mono/);
  });

  test('Cmd/Ctrl+Z undoes last action', async ({ page }) => {
    // Create item
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    await textarea.fill('Original text');
    await page.keyboard.press('Enter');
    
    // Edit the item
    await page.click('text=Original text');
    const editTextarea = page.locator('textarea').first();
    await editTextarea.fill('Modified text');
    await page.keyboard.press('Enter');
    
    // Undo
    await page.keyboard.press('Meta+z');
    
    // Should revert to original text
    await expect(page.locator('text=Original text')).toBeVisible();
    await expect(page.locator('text=Modified text')).not.toBeVisible();
  });

  test('Cmd/Ctrl+Shift+Z redoes action', async ({ page }) => {
    // Create item
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    await textarea.fill('Original text');
    await page.keyboard.press('Enter');
    
    // Edit
    await page.click('text=Original text');
    const editTextarea = page.locator('textarea').first();
    await editTextarea.fill('Modified text');
    await page.keyboard.press('Enter');
    
    // Undo
    await page.keyboard.press('Meta+z');
    
    // Redo
    await page.keyboard.press('Meta+Shift+z');
    
    // Should show modified text again
    await expect(page.locator('text=Modified text')).toBeVisible();
    await expect(page.locator('text=Original text')).not.toBeVisible();
  });

  test('Cmd/Ctrl+A selects all items', async ({ page }) => {
    // Create multiple items
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Add new item")');
      await page.locator('textarea').fill(`Item ${i}`);
      await page.keyboard.press('Enter');
    }
    await page.keyboard.press('Escape');
    
    // Select all
    await page.keyboard.press('Meta+a');
    
    // All items should be selected (have selection styling)
    const items = page.locator('.outline-desktop-content .group');
    const count = await items.count();
    
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await expect(item).toHaveClass(/selected|bg-blue-50|border-blue/);
    }
  });

  test('Delete key removes selected items', async ({ page }) => {
    // Create items
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Item to delete');
    await page.keyboard.press('Enter');
    
    await page.locator('textarea').fill('Item to keep');
    await page.keyboard.press('Escape');
    
    // Select first item
    await page.click('text=Item to delete');
    
    // Delete with keyboard
    await page.keyboard.press('Delete');
    
    // Confirm deletion if prompted
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Item should be deleted
    await expect(page.locator('text=Item to delete')).not.toBeVisible();
    await expect(page.locator('text=Item to keep')).toBeVisible();
  });
});

test.describe('TDD: Enhanced Features - Rich Text', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
  });

  test('Inline bold formatting with **text**', async ({ page }) => {
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    
    // Type markdown bold
    await textarea.fill('This is **bold text** in a sentence');
    await page.keyboard.press('Enter');
    
    // Check if bold is rendered
    const item = page.locator('div').filter({ hasText: 'This is bold text in a sentence' }).first();
    const boldText = item.locator('strong, b, .font-bold').filter({ hasText: 'bold text' });
    
    await expect(boldText).toBeVisible();
  });

  test('Inline italic formatting with *text*', async ({ page }) => {
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    
    // Type markdown italic
    await textarea.fill('This is *italic text* in a sentence');
    await page.keyboard.press('Enter');
    
    // Check if italic is rendered
    const item = page.locator('div').filter({ hasText: 'This is italic text in a sentence' }).first();
    const italicText = item.locator('em, i, .italic').filter({ hasText: 'italic text' });
    
    await expect(italicText).toBeVisible();
  });

  test('Inline code formatting with `code`', async ({ page }) => {
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    
    // Type markdown inline code
    await textarea.fill('Use `console.log()` to debug');
    await page.keyboard.press('Enter');
    
    // Check if code is rendered
    const item = page.locator('div').filter({ hasText: 'Use console.log() to debug' }).first();
    const codeText = item.locator('code, .font-mono').filter({ hasText: 'console.log()' });
    
    await expect(codeText).toBeVisible();
  });

  test('Links are clickable with [text](url)', async ({ page }) => {
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    
    // Type markdown link
    await textarea.fill('Check out [Google](https://google.com) for more');
    await page.keyboard.press('Enter');
    
    // Check if link is rendered
    const item = page.locator('div').filter({ hasText: 'Check out Google for more' }).first();
    const link = item.locator('a').filter({ hasText: 'Google' });
    
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://google.com');
    
    // Link should open in new tab
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('Mixed formatting in single item', async ({ page }) => {
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    
    // Type mixed markdown
    await textarea.fill('**Bold**, *italic*, `code`, and [link](https://example.com)');
    await page.keyboard.press('Enter');
    
    // Check all formatting is applied
    const item = page.locator('div').filter({ hasText: 'Bold, italic, code, and link' }).first();
    
    await expect(item.locator('strong, b')).toBeVisible();
    await expect(item.locator('em, i')).toBeVisible();
    await expect(item.locator('code')).toBeVisible();
    await expect(item.locator('a')).toBeVisible();
  });
});

test.describe('TDD: Enhanced Features - Real-time Collaboration', () => {
  
  test('Multiple users see real-time updates', async ({ browser }) => {
    // Create two browser contexts (simulate two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Both users go to same outline
    await page1.goto('http://localhost:5176/outlines');
    await page2.goto('http://localhost:5176/outlines');
    
    // User 1 creates an item
    await page1.click('button:has-text("Add new item")');
    await page1.locator('textarea').fill('User 1 item');
    await page1.keyboard.press('Enter');
    
    // User 2 should see the item appear (within 2 seconds)
    await expect(page2.locator('text=User 1 item')).toBeVisible({ timeout: 2000 });
    
    // User 2 creates an item
    await page2.click('button:has-text("Add new item")');
    await page2.locator('textarea').fill('User 2 item');
    await page2.keyboard.press('Enter');
    
    // User 1 should see the item appear
    await expect(page1.locator('text=User 2 item')).toBeVisible({ timeout: 2000 });
    
    await context1.close();
    await context2.close();
  });

  test('Shows user cursors/presence indicators', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto('http://localhost:5176/outlines');
    await page2.goto('http://localhost:5176/outlines');
    
    // User 1 starts editing an item
    await page1.click('button:has-text("Add new item")');
    await page1.locator('textarea').fill('Shared item');
    await page1.keyboard.press('Enter');
    
    // User 1 clicks to edit
    await page1.click('text=Shared item');
    
    // User 2 should see indicator that User 1 is editing
    const indicator = page2.locator('.user-cursor, .editing-indicator, [data-user-presence]');
    await expect(indicator).toBeVisible({ timeout: 2000 });
    
    // Indicator should show user info
    await expect(indicator).toContainText(/User|user1@example.com/);
    
    await context1.close();
    await context2.close();
  });

  test('Handles concurrent edits without conflicts', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto('http://localhost:5176/outlines');
    await page2.goto('http://localhost:5176/outlines');
    
    // Create initial items
    await page1.click('button:has-text("Add new item")');
    await page1.locator('textarea').fill('Item A');
    await page1.keyboard.press('Enter');
    
    await page1.locator('textarea').fill('Item B');
    await page1.keyboard.press('Escape');
    
    // Wait for sync
    await page2.waitForTimeout(1000);
    
    // Both users edit different items simultaneously
    await page1.click('text=Item A');
    await page2.click('text=Item B');
    
    const textarea1 = page1.locator('textarea').first();
    const textarea2 = page2.locator('textarea').first();
    
    await textarea1.fill('Item A - edited by User 1');
    await textarea2.fill('Item B - edited by User 2');
    
    await page1.keyboard.press('Enter');
    await page2.keyboard.press('Enter');
    
    // Both edits should be preserved
    await expect(page1.locator('text=Item A - edited by User 1')).toBeVisible();
    await expect(page1.locator('text=Item B - edited by User 2')).toBeVisible();
    
    await expect(page2.locator('text=Item A - edited by User 1')).toBeVisible();
    await expect(page2.locator('text=Item B - edited by User 2')).toBeVisible();
    
    await context1.close();
    await context2.close();
  });

  test('Shows active users in outline', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();
    
    // All users join same outline
    await page1.goto('http://localhost:5176/outlines');
    await page2.goto('http://localhost:5176/outlines');
    await page3.goto('http://localhost:5176/outlines');
    
    // Each page should show active user count/avatars
    const activeUsers1 = page1.locator('.active-users, [data-active-users]');
    const activeUsers2 = page2.locator('.active-users, [data-active-users]');
    
    // Should show 3 active users
    await expect(activeUsers1).toContainText('3');
    await expect(activeUsers2).toContainText('3');
    
    // User 3 leaves
    await context3.close();
    
    // Should update to 2 active users
    await expect(activeUsers1).toContainText('2');
    await expect(activeUsers2).toContainText('2');
    
    await context1.close();
    await context2.close();
  });
});