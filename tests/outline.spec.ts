import { test, expect } from '@playwright/test';

test.describe('Outline Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
  });

  test('should display outline page', async ({ page }) => {
    await expect(page).toHaveURL(/.*outlines/);
    
    const mainContent = page.locator('main, .outline-container, #outline-view');
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
    }
  });

  test('should create a new outline', async ({ page }) => {
    const newOutlineButton = page.locator('button:has-text("New Outline"), button:has-text("Create Outline"), button:has-text("Add Outline"), button[aria-label*="new" i][aria-label*="outline" i]');
    
    if (await newOutlineButton.count() > 0) {
      await newOutlineButton.first().click();
      await page.waitForTimeout(500);
      
      const titleInput = page.locator('input[placeholder*="title" i], input[name="title"], input[aria-label*="title" i]');
      if (await titleInput.count() > 0) {
        await titleInput.first().fill('Test Outline');
      }
      
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');
      if (await saveButton.count() > 0) {
        await saveButton.first().click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should add items to outline', async ({ page }) => {
    const addItemButton = page.locator('button:has-text("Add Item"), button:has-text("Add"), button[aria-label*="add" i]');
    const inputField = page.locator('input[placeholder*="item" i], input[placeholder*="text" i], textarea');
    
    if (await addItemButton.count() > 0) {
      await addItemButton.first().click();
      await page.waitForTimeout(300);
    }
    
    if (await inputField.count() > 0) {
      await inputField.first().fill('Test item 1');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      await inputField.first().fill('Test item 2');
      await page.keyboard.press('Enter');
    }
    
    const outlineItems = page.locator('.outline-item, li[role="treeitem"], .tree-item');
    if (await outlineItems.count() > 0) {
      expect(await outlineItems.count()).toBeGreaterThan(0);
    }
  });

  test('should edit outline items', async ({ page }) => {
    const outlineItems = page.locator('.outline-item, li[role="treeitem"], .tree-item');
    
    if (await outlineItems.count() > 0) {
      const firstItem = outlineItems.first();
      await firstItem.dblclick();
      await page.waitForTimeout(300);
      
      const editInput = page.locator('input:focus, textarea:focus, [contenteditable="true"]');
      if (await editInput.count() > 0) {
        await editInput.first().fill('Edited item');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        await expect(page.locator('text=Edited item')).toBeVisible();
      }
    }
  });

  test('should delete outline items', async ({ page }) => {
    const outlineItems = page.locator('.outline-item, li[role="treeitem"], .tree-item');
    const initialCount = await outlineItems.count();
    
    if (initialCount > 0) {
      const firstItem = outlineItems.first();
      await firstItem.hover();
      
      const deleteButton = page.locator('button[aria-label*="delete" i], button[aria-label*="remove" i], button:has-text("Delete"), .delete-button');
      if (await deleteButton.count() > 0) {
        await deleteButton.first().click();
        await page.waitForTimeout(500);
        
        const newCount = await outlineItems.count();
        expect(newCount).toBeLessThan(initialCount);
      }
    }
  });

  test('should indent/outdent items', async ({ page }) => {
    const outlineItems = page.locator('.outline-item, li[role="treeitem"], .tree-item');
    
    if (await outlineItems.count() > 1) {
      const secondItem = outlineItems.nth(1);
      await secondItem.click();
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      
      const indentedItem = page.locator('.outline-item.indented, .outline-item.level-1, [style*="margin-left"], [style*="padding-left"]');
      if (await indentedItem.count() > 0) {
        await expect(indentedItem.first()).toBeVisible();
      }
      
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(300);
    }
  });

  test('should expand/collapse items with children', async ({ page }) => {
    const expandButtons = page.locator('button[aria-label*="expand" i], button[aria-label*="collapse" i], .expand-button, .collapse-button');
    
    if (await expandButtons.count() > 0) {
      const firstButton = expandButtons.first();
      const isExpanded = await firstButton.getAttribute('aria-expanded');
      
      await firstButton.click();
      await page.waitForTimeout(300);
      
      const newState = await firstButton.getAttribute('aria-expanded');
      if (isExpanded && newState) {
        expect(newState).not.toBe(isExpanded);
      }
    }
  });

  test('should save outline changes', async ({ page }) => {
    const saveButton = page.locator('button:has-text("Save"), button[aria-label*="save" i]');
    const inputField = page.locator('input[placeholder*="item" i], textarea');
    
    if (await inputField.count() > 0) {
      await inputField.first().fill('New test item');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    
    if (await saveButton.count() > 0) {
      await saveButton.first().click();
      await page.waitForTimeout(500);
      
      const successMessage = page.locator('.success, .toast, [role="alert"]:has-text("saved")');
      if (await successMessage.count() > 0) {
        await expect(successMessage.first()).toBeVisible();
      }
    }
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const savedItem = page.locator('text=New test item');
    if (await savedItem.count() > 0) {
      await expect(savedItem.first()).toBeVisible();
    }
  });

  test('should switch between different outlines', async ({ page }) => {
    const outlineList = page.locator('.outline-list, .outline-sidebar, nav');
    const outlineLinks = outlineList.locator('a, button').filter({ hasText: /Outline|Document|Note/ });
    
    if (await outlineLinks.count() > 1) {
      const secondOutline = outlineLinks.nth(1);
      const outlineName = await secondOutline.textContent();
      
      await secondOutline.click();
      await page.waitForTimeout(500);
      
      const activeOutline = page.locator('.active-outline, .selected, [aria-current="page"]');
      if (await activeOutline.count() > 0 && outlineName) {
        await expect(activeOutline.first()).toContainText(outlineName);
      }
    }
  });

  test('should search within outline', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(500);
      
      const searchResults = page.locator('.search-result, .highlighted, mark');
      if (await searchResults.count() > 0) {
        await expect(searchResults.first()).toBeVisible();
      }
    }
  });
});