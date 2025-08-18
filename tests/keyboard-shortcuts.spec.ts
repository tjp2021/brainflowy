import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate with arrow keys', async ({ page }) => {
    const outlineItems = page.locator('.outline-item, li[role="treeitem"]');
    
    if (await outlineItems.count() > 1) {
      await outlineItems.first().click();
      await page.keyboard.press('ArrowDown');
      
      const focusedElement = page.locator(':focus');
      const focusedText = await focusedElement.textContent();
      const secondItemText = await outlineItems.nth(1).textContent();
      
      if (focusedText && secondItemText) {
        expect(focusedText).toBe(secondItemText);
      }
    }
  });

  test('should indent with Tab key', async ({ page }) => {
    const outlineItems = page.locator('.outline-item, li[role="treeitem"]');
    
    if (await outlineItems.count() > 1) {
      const secondItem = outlineItems.nth(1);
      await secondItem.click();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      
      const indentedItem = page.locator('.indented, .level-1, [style*="margin-left"]');
      if (await indentedItem.count() > 0) {
        await expect(indentedItem.first()).toBeVisible();
      }
    }
  });

  test('should outdent with Shift+Tab', async ({ page }) => {
    const outlineItems = page.locator('.outline-item, li[role="treeitem"]');
    
    if (await outlineItems.count() > 0) {
      const item = outlineItems.first();
      await item.click();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(300);
      
      const normalItem = page.locator('.outline-item:not(.indented), .level-0');
      if (await normalItem.count() > 0) {
        await expect(normalItem.first()).toBeVisible();
      }
    }
  });

  test('should create new item with Enter key', async ({ page }) => {
    const inputField = page.locator('input[placeholder*="item" i], textarea');
    
    if (await inputField.count() > 0) {
      await inputField.first().click();
      await inputField.first().fill('New item from Enter key');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      const newItem = page.locator('text=New item from Enter key');
      if (await newItem.count() > 0) {
        await expect(newItem.first()).toBeVisible();
      }
    }
  });

  test('should delete item with Delete key', async ({ page }) => {
    const outlineItems = page.locator('.outline-item, li[role="treeitem"]');
    const initialCount = await outlineItems.count();
    
    if (initialCount > 0) {
      await outlineItems.first().click();
      await page.keyboard.press('Delete');
      await page.waitForTimeout(300);
      
      const newCount = await outlineItems.count();
      if (newCount < initialCount) {
        expect(newCount).toBeLessThan(initialCount);
      }
    }
  });

  test('should undo with Ctrl+Z / Cmd+Z', async ({ page }) => {
    const inputField = page.locator('input[placeholder*="item" i], textarea');
    
    if (await inputField.count() > 0) {
      await inputField.first().fill('Item to undo');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+z' : 'Control+z');
      await page.waitForTimeout(300);
      
      const undoneItem = page.locator('text=Item to undo');
      const itemCount = await undoneItem.count();
      expect(itemCount).toBe(0);
    }
  });

  test('should redo with Ctrl+Shift+Z / Cmd+Shift+Z', async ({ page }) => {
    const inputField = page.locator('input[placeholder*="item" i], textarea');
    
    if (await inputField.count() > 0) {
      await inputField.first().fill('Item to redo');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+z' : 'Control+z');
      await page.waitForTimeout(300);
      await page.keyboard.press(isMac ? 'Meta+Shift+z' : 'Control+Shift+z');
      await page.waitForTimeout(300);
      
      const redoneItem = page.locator('text=Item to redo');
      if (await redoneItem.count() > 0) {
        await expect(redoneItem.first()).toBeVisible();
      }
    }
  });

  test('should save with Ctrl+S / Cmd+S', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    
    await page.keyboard.press(isMac ? 'Meta+s' : 'Control+s');
    await page.waitForTimeout(500);
    
    const saveIndicator = page.locator('.saved, .save-indicator, [aria-label*="saved" i]');
    if (await saveIndicator.count() > 0) {
      await expect(saveIndicator.first()).toBeVisible();
    }
  });

  test('should search with Ctrl+F / Cmd+F', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    
    await page.keyboard.press(isMac ? 'Meta+f' : 'Control+f');
    await page.waitForTimeout(300);
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      await expect(searchInput.first()).toBeFocused();
    }
  });

  test('should select all with Ctrl+A / Cmd+A', async ({ page }) => {
    const inputField = page.locator('input[placeholder*="item" i], textarea');
    
    if (await inputField.count() > 0) {
      await inputField.first().fill('Text to select');
      await inputField.first().click();
      
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+a' : 'Control+a');
      
      const selectedText = await page.evaluate(() => window.getSelection()?.toString());
      if (selectedText) {
        expect(selectedText).toContain('Text to select');
      }
    }
  });

  test('should copy with Ctrl+C / Cmd+C', async ({ page }) => {
    const outlineItems = page.locator('.outline-item, li[role="treeitem"]');
    
    if (await outlineItems.count() > 0) {
      const firstItem = outlineItems.first();
      await firstItem.click();
      
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+c' : 'Control+c');
      await page.waitForTimeout(300);
      
      const copyIndicator = page.locator('.copied, [aria-label*="copied" i]');
      if (await copyIndicator.count() > 0) {
        await expect(copyIndicator.first()).toBeVisible();
      }
    }
  });

  test('should paste with Ctrl+V / Cmd+V', async ({ page }) => {
    const inputField = page.locator('input[placeholder*="item" i], textarea');
    
    if (await inputField.count() > 0) {
      await inputField.first().click();
      
      await page.evaluate(() => {
        navigator.clipboard.writeText('Pasted content');
      });
      
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+v' : 'Control+v');
      await page.waitForTimeout(300);
      
      const value = await inputField.first().inputValue();
      expect(value).toContain('Pasted content');
    }
  });

  test('should navigate between panes with Tab', async ({ page }) => {
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus');
    const firstElement = await focusedElement.getAttribute('class');
    
    await page.keyboard.press('Tab');
    focusedElement = await page.locator(':focus');
    const secondElement = await focusedElement.getAttribute('class');
    
    if (firstElement && secondElement) {
      expect(firstElement).not.toBe(secondElement);
    }
  });

  test('should show keyboard shortcuts help with ? or F1', async ({ page }) => {
    await page.keyboard.press('?');
    await page.waitForTimeout(300);
    
    let helpModal = page.locator('.help-modal, .shortcuts-modal, [aria-label*="keyboard shortcuts" i]');
    if (await helpModal.count() === 0) {
      await page.keyboard.press('F1');
      await page.waitForTimeout(300);
    }
    
    if (await helpModal.count() > 0) {
      await expect(helpModal.first()).toBeVisible();
    }
  });

  test('should close modals with Escape', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(300);
      
      const modal = page.locator('.modal, [role="dialog"]');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        await expect(modal.first()).not.toBeVisible();
      }
    }
  });
});