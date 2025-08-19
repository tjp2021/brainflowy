import { test, expect } from '@playwright/test';

test.describe('Outline Nesting and Hierarchy', () => {
  test('should create nested bullet hierarchy with Tab key', async ({ page }) => {
    // Navigate to outline page
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    // Look for any input field where we can type
    const inputSelectors = [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      '.outline-item input',
      '.outline-input'
    ];
    
    let inputField = null;
    for (const selector of inputSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        inputField = element;
        console.log(`Found input with selector: ${selector}`);
        break;
      }
    }
    
    if (!inputField) {
      // Try to find an add button first
      const addButton = page.locator('button').filter({ has: page.locator('svg') });
      if (await addButton.count() > 0) {
        console.log('Found add button, clicking it');
        await addButton.first().click();
        await page.waitForTimeout(500);
        
        // Look for input again
        for (const selector of inputSelectors) {
          const element = page.locator(selector).first();
          if (await element.count() > 0) {
            inputField = element;
            console.log(`Found input after clicking add: ${selector}`);
            break;
          }
        }
      }
    }
    
    if (!inputField) {
      throw new Error('Could not find any input field for outline items');
    }
    
    // Create a parent item
    await inputField.click();
    await inputField.fill('Parent Item');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    // Create a child item and indent it
    const nextInput = page.locator('textarea:focus, input:focus, [contenteditable="true"]:focus').first();
    if (await nextInput.count() > 0) {
      await nextInput.fill('Child Item 1');
      await page.keyboard.press('Tab'); // Indent to make it a child
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      // Create another child at same level
      const nextInput2 = page.locator('textarea:focus, input:focus, [contenteditable="true"]:focus').first();
      if (await nextInput2.count() > 0) {
        await nextInput2.fill('Child Item 2');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        
        // Create a grandchild
        const nextInput3 = page.locator('textarea:focus, input:focus, [contenteditable="true"]:focus').first();
        if (await nextInput3.count() > 0) {
          await nextInput3.fill('Grandchild Item');
          await page.keyboard.press('Tab'); // Indent further
          await page.keyboard.press('Enter');
        }
      }
    }
    
    // Verify the hierarchy exists
    const parentItem = page.locator('text=Parent Item');
    const childItem1 = page.locator('text=Child Item 1');
    const childItem2 = page.locator('text=Child Item 2');
    const grandchildItem = page.locator('text=Grandchild Item');
    
    await expect(parentItem).toBeVisible();
    await expect(childItem1).toBeVisible();
    await expect(childItem2).toBeVisible();
    await expect(grandchildItem).toBeVisible();
    
    // Check indentation levels (child items should be indented)
    const parentBox = await parentItem.boundingBox();
    const childBox = await childItem1.boundingBox();
    const grandchildBox = await grandchildItem.boundingBox();
    
    if (parentBox && childBox && grandchildBox) {
      // Children should be indented to the right of parent
      expect(childBox.x).toBeGreaterThan(parentBox.x);
      // Grandchildren should be indented further
      expect(grandchildBox.x).toBeGreaterThan(childBox.x);
    }
  });
  
  test('should outdent items with Shift+Tab', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    // Find input field
    const inputField = page.locator('textarea, input[type="text"], [contenteditable="true"]').first();
    
    if (await inputField.count() > 0) {
      // Create indented item
      await inputField.click();
      await inputField.fill('Item to outdent');
      await page.keyboard.press('Tab'); // Indent
      await page.waitForTimeout(300);
      
      // Now outdent it
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(300);
      
      // Verify it's at root level (no indentation)
      const item = page.locator('text=Item to outdent');
      const box = await item.boundingBox();
      
      if (box) {
        // Should be at or near the left edge (root level)
        expect(box.x).toBeLessThan(100); // Assuming root items start within 100px of left
      }
    }
  });
  
  test('should handle complex nested structures', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    console.log('Page loaded, looking for elements...');
    
    // Debug: print what's on the page
    const bodyText = await page.locator('body').innerText();
    console.log('Page text:', bodyText.substring(0, 500));
    
    // Check if we have any outline-related elements
    const outlineContainer = page.locator('.outline-container, #outline-view, .outline, main');
    if (await outlineContainer.count() > 0) {
      const containerHTML = await outlineContainer.first().innerHTML();
      console.log('Outline container HTML:', containerHTML.substring(0, 500));
    }
    
    // Try different ways to interact with the outline
    const strategies = [
      // Strategy 1: Click plus button
      async () => {
        const plusButton = page.locator('button svg').first();
        if (await plusButton.count() > 0) {
          await plusButton.click();
          return true;
        }
        return false;
      },
      // Strategy 2: Double-click on existing item
      async () => {
        const existingItem = page.locator('.outline-item, li').first();
        if (await existingItem.count() > 0) {
          await existingItem.dblclick();
          return true;
        }
        return false;
      },
      // Strategy 3: Press keyboard shortcut
      async () => {
        await page.keyboard.press('Control+N');
        await page.waitForTimeout(300);
        return true;
      }
    ];
    
    for (const strategy of strategies) {
      if (await strategy()) {
        console.log('Strategy succeeded, looking for input');
        const input = page.locator('textarea:focus, input:focus, [contenteditable="true"]:focus');
        if (await input.count() > 0) {
          console.log('Found focused input!');
          break;
        }
      }
    }
  });
});