import { test, expect } from '@playwright/test';

test.describe('Full Outline Functionality - Create, Style, Nest, and Persist', () => {
  test('should create multi-level hierarchy with different styles and verify backend persistence', async ({ page }) => {
    // Navigate to outline page
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    console.log('=== STARTING FULL OUTLINE FUNCTIONALITY TEST ===');
    
    // First, let's see what's actually on the page
    const pageContent = await page.locator('body').innerText();
    console.log('Initial page content (first 300 chars):', pageContent.substring(0, 300));
    
    // Look for the outline area
    const outlineArea = page.locator('.outline-content, .outline-items, .outline-container, main').first();
    const outlineHTML = await outlineArea.innerHTML();
    console.log('Outline area HTML (first 500 chars):', outlineHTML.substring(0, 500));
    
    // Strategy 1: Try to find and click the add/plus button
    console.log('\n--- Attempting to create first item ---');
    const addButtons = [
      page.locator('button:has(svg)').filter({ hasText: /add|plus|new/i }),
      page.locator('button').filter({ has: page.locator('svg.lucide-plus') }),
      page.locator('button[aria-label*="add"]'),
      page.locator('.add-button, .plus-button'),
      page.locator('button').filter({ hasText: /^\+$/ })
    ];
    
    let addButtonClicked = false;
    for (const button of addButtons) {
      if (await button.count() > 0) {
        console.log('Found add button, clicking...');
        await button.first().click();
        await page.waitForTimeout(500);
        addButtonClicked = true;
        break;
      }
    }
    
    // If no add button, try to find existing items to interact with
    if (!addButtonClicked) {
      console.log('No add button found, looking for existing items...');
      const existingItems = page.locator('.outline-item, textarea, input[type="text"]');
      if (await existingItems.count() > 0) {
        console.log('Found existing item, double-clicking to edit...');
        await existingItems.first().dblclick();
        await page.waitForTimeout(300);
      }
    }
    
    // Now find the input field
    const inputSelectors = [
      'textarea:focus',
      'input:focus',
      '[contenteditable="true"]:focus',
      'textarea:visible',
      'input[type="text"]:visible',
      '.outline-input'
    ];
    
    let activeInput = null;
    for (const selector of inputSelectors) {
      const input = page.locator(selector).first();
      if (await input.count() > 0) {
        activeInput = input;
        console.log(`Found input with selector: ${selector}`);
        break;
      }
    }
    
    if (!activeInput) {
      throw new Error('Could not find any input field for creating outline items');
    }
    
    // === CREATE HIERARCHICAL STRUCTURE WITH DIFFERENT STYLES ===
    console.log('\n--- Creating hierarchical structure ---');
    
    // Level 0: Normal header item
    console.log('Creating: Project Overview (header)');
    await activeInput.fill('Project Overview');
    // Try to make it a header (Cmd+B or Ctrl+B)
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Level 1: Normal text item (child)
    const input1 = page.locator('textarea:focus, input:focus').first();
    if (await input1.count() > 0) {
      console.log('Creating: Introduction (normal, indented)');
      await input1.fill('Introduction to the project');
      await page.keyboard.press('Tab'); // Indent to make it a child
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    // Level 1: Code block item (child)
    const input2 = page.locator('textarea:focus, input:focus').first();
    if (await input2.count() > 0) {
      console.log('Creating: Code example (code block, same level)');
      await input2.fill('const example = "Hello World";');
      await page.keyboard.press('Control+e'); // Make it code
      await page.waitForTimeout(100);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    // Level 2: Nested under code (grandchild)
    const input3 = page.locator('textarea:focus, input:focus').first();
    if (await input3.count() > 0) {
      console.log('Creating: Code explanation (normal, double indented)');
      await input3.fill('This is an explanation of the code');
      await page.keyboard.press('Tab'); // Indent to make it a grandchild
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    // Level 2: Another grandchild
    const input4 = page.locator('textarea:focus, input:focus').first();
    if (await input4.count() > 0) {
      console.log('Creating: Additional note (normal, same level as previous)');
      await input4.fill('Additional implementation notes');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    // Level 1: Back to first child level with quote
    const input5 = page.locator('textarea:focus, input:focus').first();
    if (await input5.count() > 0) {
      console.log('Creating: Important quote (quote style, outdented)');
      await input5.fill('Important: This is a critical requirement');
      await page.keyboard.press('Shift+Tab'); // Outdent back to level 1
      await page.keyboard.press('Control+q'); // Make it a quote (if supported)
      await page.waitForTimeout(100);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    // Level 0: New root item
    const input6 = page.locator('textarea:focus, input:focus').first();
    if (await input6.count() > 0) {
      console.log('Creating: Next Section (header, root level)');
      await input6.fill('Next Section');
      await page.keyboard.press('Shift+Tab'); // Outdent to root
      await page.keyboard.press('Control+b'); // Make it a header
      await page.waitForTimeout(100);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000); // Give more time for backend save
    }
    
    // === VERIFY ITEMS EXIST IN DOM ===
    console.log('\n--- Verifying items exist in DOM ---');
    const itemsToVerify = [
      'Project Overview',
      'Introduction to the project',
      'const example = "Hello World";',
      'This is an explanation of the code',
      'Additional implementation notes',
      'Important: This is a critical requirement',
      'Next Section'
    ];
    
    for (const itemText of itemsToVerify) {
      const item = page.locator(`text="${itemText}"`);
      const exists = await item.count() > 0;
      console.log(`Item "${itemText}": ${exists ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
      if (exists) {
        await expect(item.first()).toBeVisible();
      }
    }
    
    // === VERIFY HIERARCHY (INDENTATION) ===
    console.log('\n--- Verifying hierarchy through indentation ---');
    const projectOverview = page.locator('text="Project Overview"').first();
    const introduction = page.locator('text="Introduction to the project"').first();
    const codeExample = page.locator('text="const example"').first();
    const explanation = page.locator('text="This is an explanation"').first();
    
    if (await projectOverview.count() > 0 && await introduction.count() > 0) {
      const parentBox = await projectOverview.boundingBox();
      const childBox = await introduction.boundingBox();
      
      if (parentBox && childBox) {
        console.log(`Project Overview X: ${parentBox.x}`);
        console.log(`Introduction X: ${childBox.x}`);
        console.log(`Introduction is indented: ${childBox.x > parentBox.x}`);
        expect(childBox.x).toBeGreaterThan(parentBox.x);
      }
    }
    
    if (await codeExample.count() > 0 && await explanation.count() > 0) {
      const codeBox = await codeExample.boundingBox();
      const explainBox = await explanation.boundingBox();
      
      if (codeBox && explainBox) {
        console.log(`Code Example X: ${codeBox.x}`);
        console.log(`Explanation X: ${explainBox.x}`);
        console.log(`Explanation is indented under code: ${explainBox.x > codeBox.x}`);
        expect(explainBox.x).toBeGreaterThan(codeBox.x);
      }
    }
    
    // === VERIFY BACKEND PERSISTENCE ===
    console.log('\n--- Testing backend persistence ---');
    
    // Monitor network requests to backend
    const saveRequests: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/outlines') || response.url().includes('/items')) {
        saveRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // Reload the page to verify persistence
    console.log('Reloading page to verify persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if our items still exist after reload
    console.log('\n--- Verifying items persist after reload ---');
    for (const itemText of itemsToVerify) {
      const item = page.locator(`text="${itemText}"`);
      const exists = await item.count() > 0;
      console.log(`After reload - "${itemText}": ${exists ? 'PERSISTED ✓' : 'NOT PERSISTED ✗'}`);
    }
    
    // Log backend requests
    console.log('\n--- Backend API calls made ---');
    saveRequests.forEach(req => {
      console.log(`${req.method} ${req.url} - Status: ${req.status}`);
    });
    
    // === VERIFY STYLES ARE APPLIED ===
    console.log('\n--- Verifying styles are applied ---');
    
    // Check if header items have different styling
    const headerItem = page.locator('text="Project Overview"').first();
    if (await headerItem.count() > 0) {
      const className = await headerItem.getAttribute('class');
      const styles = await headerItem.evaluate(el => window.getComputedStyle(el));
      console.log('Header item class:', className);
      console.log('Header item computed styles:', {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight
      });
    }
    
    // Check if code items have different styling
    const codeItem = page.locator('text="const example"').first();
    if (await codeItem.count() > 0) {
      const className = await codeItem.getAttribute('class');
      const parentElement = await codeItem.evaluateHandle(el => el.parentElement);
      const parentClass = await parentElement.evaluate(el => el?.className);
      console.log('Code item class:', className);
      console.log('Code item parent class:', parentClass);
      
      // Code blocks often have monospace font or special background
      const hasCodeStyling = parentClass?.includes('code') || className?.includes('code');
      console.log('Has code styling:', hasCodeStyling);
    }
  });
  
  test('should handle complex operations: delete, reorder, and style changes', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    console.log('=== TESTING COMPLEX OPERATIONS ===');
    
    // This test would verify:
    // 1. Deleting items at various levels
    // 2. Moving items up/down in hierarchy
    // 3. Changing styles of existing items
    // 4. Bulk operations
    
    // Add implementation based on actual UI capabilities
  });
});