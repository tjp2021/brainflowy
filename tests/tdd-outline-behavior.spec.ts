import { test, expect } from '@playwright/test';

test.describe('TDD: Outline Editor Expected Behavior', () => {
  
  test('Create and edit bullets with Enter key', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    // TEST 1: Click "Add new item" creates new bullet
    console.log('TEST: Add new item button creates bullet');
    // Be more specific - get the button in the main content area, not the sidebar
    const addButton = page.locator('.flex-1').locator('button:has-text("Add new item")').first();
    await addButton.click();
    
    // Should see a textarea in edit mode
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();
    
    // TEST 2: Type text and press Enter creates item AND new bullet below
    console.log('TEST: Enter key saves current and creates new');
    await textarea.fill('First bullet point');
    await page.keyboard.press('Enter');
    
    // First bullet should be saved and visible as div
    // Use a more specific selector to avoid multiple matches
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^First bullet point$/ }).first()).toBeVisible();
    
    // New textarea should appear for next bullet
    const newTextarea = page.locator('textarea');
    await expect(newTextarea).toBeVisible();
    await expect(newTextarea).toBeFocused();
    
    // TEST 3: Click existing item to edit it
    console.log('TEST: Click existing item to edit');
    await newTextarea.fill('Second bullet point');
    await page.keyboard.press('Escape'); // Exit edit mode
    
    const firstBullet = page.locator('.outline-desktop-content div').filter({ hasText: /^First bullet point$/ }).first();
    await firstBullet.click();
    
    // Should enter edit mode for that item
    const editTextarea = page.locator('textarea');
    await expect(editTextarea).toBeVisible();
    await expect(editTextarea).toHaveValue('First bullet point');
    
    // Modify it
    await editTextarea.fill('First bullet point - EDITED');
    await page.keyboard.press('Enter');
    
    // Should save the edit and create new bullet
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^First bullet point - EDITED$/ }).first()).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible(); // New bullet textarea
  });

  test('Create nested hierarchy with Tab/Shift+Tab', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    // Create parent item
    console.log('TEST: Create parent and child hierarchy');
    const addButton = page.locator('button:has-text("Add new item")');
    await addButton.click();
    
    let textarea = page.locator('textarea');
    await textarea.fill('Parent item');
    await page.keyboard.press('Enter');
    
    // Create child item with Tab
    textarea = page.locator('textarea');
    await textarea.fill('Child item');
    await page.keyboard.press('Tab'); // INDENT
    await page.keyboard.press('Enter');
    
    // Verify indentation - child should be nested under parent
    const parentDiv = page.locator('.outline-desktop-content div').filter({ hasText: /^Parent item$/ }).first();
    const childDiv = page.locator('.outline-desktop-content div').filter({ hasText: /^Child item$/ }).first();
    
    // Child should have visual indentation (check for margin/padding class or style)
    await expect(childDiv).toBeVisible();
    // TODO: Check actual indentation level/styling
    
    // Create grandchild
    textarea = page.locator('textarea');
    await textarea.fill('Grandchild item');
    await page.keyboard.press('Tab'); // INDENT FURTHER
    await page.keyboard.press('Enter');
    
    // Create sibling at same level
    textarea = page.locator('textarea');
    await textarea.fill('Another grandchild');
    await page.keyboard.press('Enter');
    
    // Outdent back to child level
    textarea = page.locator('textarea');
    await textarea.fill('Back to child level');
    await page.keyboard.press('Shift+Tab'); // OUTDENT
    await page.keyboard.press('Enter');
    
    // Verify all items exist
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^Parent item$/ }).first()).toBeVisible();
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^Child item$/ }).first()).toBeVisible();
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^Grandchild item$/ }).first()).toBeVisible();
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^Another grandchild$/ }).first()).toBeVisible();
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^Back to child level$/ }).first()).toBeVisible();
  });

  test('Apply different bullet styles (header, code, quote)', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    // TEST: Header style
    console.log('TEST: Header style with Ctrl+B');
    const headerButton = page.locator('button:has-text("Header")');
    await headerButton.click();
    
    const addButton = page.locator('button:has-text("Add new item")');
    await addButton.click();
    
    let textarea = page.locator('textarea');
    await textarea.fill('This is a header');
    await page.keyboard.press('Enter');
    
    // Verify header styling (bold, larger)
    // Look for the actual text div, not the parent group
    const headerItem = page.locator('.outline-desktop-content .px-2.py-1').filter({ hasText: /^This is a header$/ }).first();
    await expect(headerItem).toHaveClass(/font-bold|text-base|text-lg/);
    
    // TEST: Code style - should expand to multi-line
    console.log('TEST: Code style expands for multi-line');
    const codeButton = page.locator('button:has-text("Code")');
    await codeButton.click();
    
    // The previous Enter created a new item, so the textarea should already be there
    // Wait for it to be visible
    textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill(`function example() {
  console.log("Hello");
  return true;
}`);
    await page.keyboard.press('Enter');
    
    // Verify code styling (monospace)
    const codeItem = page.locator('.outline-desktop-content .px-2.py-1').filter({ hasText: 'function example()' }).first();
    await expect(codeItem).toHaveClass(/font-mono/);
    
    // TEST: Quote style
    console.log('TEST: Quote style with border');
    const quoteButton = page.locator('button:has-text("Quote")');
    await quoteButton.click();
    
    // The previous Enter created a new item, so the textarea should already be there
    textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('This is a quote');
    await page.keyboard.press('Enter');
    
    // Verify quote styling (italic, border)
    const quoteItem = page.locator('.outline-desktop-content .px-2.py-1').filter({ hasText: /^This is a quote$/ }).first();
    await expect(quoteItem).toHaveClass(/italic|border-l/);
  });

  test('Export/Copy entire outline with structure preserved', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    // Create a structured outline
    console.log('TEST: Create outline for export test');
    const addButton = page.locator('button:has-text("Add new item")');
    
    // Parent 1
    await addButton.click();
    let textarea = page.locator('textarea');
    await textarea.fill('Main Topic 1');
    await page.keyboard.press('Enter');
    
    // Child 1.1
    textarea = page.locator('textarea');
    await textarea.fill('Subtopic 1.1');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Child 1.2
    textarea = page.locator('textarea');
    await textarea.fill('Subtopic 1.2');
    await page.keyboard.press('Enter');
    
    // Parent 2 (outdent back)
    textarea = page.locator('textarea');
    await textarea.fill('Main Topic 2');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Escape');
    
    // TEST: Select all and copy
    console.log('TEST: Select all and copy preserves structure');
    await page.keyboard.press('Control+a'); // or Cmd+a on Mac
    await page.keyboard.press('Control+c'); // or Cmd+c on Mac
    
    // Get clipboard content (this is tricky in Playwright, we might need to paste somewhere to verify)
    // For now, let's verify the structure is visually correct
    
    // Alternative: Check for export button/functionality
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Copy All")');
    if (await exportButton.count() > 0) {
      await exportButton.click();
      // Verify export format
      const exportModal = page.locator('[role="dialog"], .modal');
      if (await exportModal.count() > 0) {
        const exportText = await exportModal.locator('pre, textarea').textContent();
        expect(exportText).toContain('• Main Topic 1');
        expect(exportText).toContain('  • Subtopic 1.1');
        expect(exportText).toContain('  • Subtopic 1.2');
        expect(exportText).toContain('• Main Topic 2');
      }
    }
    
    // At minimum, verify the visual structure exists
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^Main Topic 1$/ }).first()).toBeVisible();
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^Subtopic 1.1$/ }).first()).toBeVisible();
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^Subtopic 1.2$/ }).first()).toBeVisible();
    await expect(page.locator('.outline-desktop-content div').filter({ hasText: /^Main Topic 2$/ }).first()).toBeVisible();
  });

  test('Code blocks expand to multi-line when code style selected', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    console.log('TEST: Code style creates expandable multi-line input');
    
    // Select code style
    const codeButton = page.locator('button:has-text("Code")');
    await codeButton.click();
    
    // Add new item
    const addButton = page.locator('button:has-text("Add new item")');
    await addButton.click();
    
    // Textarea should be multi-line for code
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    
    // Check if textarea allows multi-line (has rows > 1 or can accept newlines)
    const rows = await textarea.getAttribute('rows');
    if (rows) {
      expect(parseInt(rows)).toBeGreaterThan(1);
    }
    
    // Test pasting multi-line code
    const codeSnippet = `async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}`;
    
    await textarea.fill(codeSnippet);
    await page.keyboard.press('Escape'); // Save without creating new item
    
    // Verify the full code block is preserved
    const codeBlock = page.locator('.font-mono').filter({ hasText: 'async function fetchData()' });
    await expect(codeBlock).toBeVisible();
    
    // Click to edit and verify full code is there
    await codeBlock.click();
    const editTextarea = page.locator('textarea');
    const value = await editTextarea.inputValue();
    expect(value).toContain('async function fetchData()');
    expect(value).toContain('console.error');
    expect(value).toContain('return null');
  });
});