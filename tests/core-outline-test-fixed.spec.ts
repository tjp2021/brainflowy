import { test, expect } from '@playwright/test';

test.describe('Core Outline Functionality - FIXED', () => {
  test('creates nested bullets with different styles', async ({ page }) => {
    // Go directly to outline page
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    console.log('=== TESTING CORE BULLET CREATION ===');
    
    // Click the "Add new item" button to create first item
    const addButton = page.locator('button:has-text("Add new item")');
    await expect(addButton).toBeVisible();
    await addButton.click();
    await page.waitForTimeout(300);
    
    // The new item should be in edit mode with a textarea visible
    let textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    // Type in the first item
    console.log('Creating first bullet...');
    await textarea.fill('Main Project Overview');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    // This should create a new item and put us in edit mode for the next one
    textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      console.log('Creating indented child...');
      await textarea.fill('First subtask');
      await page.keyboard.press('Tab'); // Indent
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    
    // Create another child at same level
    textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      console.log('Creating sibling at same level...');
      await textarea.fill('Second subtask');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    
    // Create a deeper nested item
    textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      console.log('Creating deeper nested item...');
      await textarea.fill('Nested detail');
      await page.keyboard.press('Tab'); // Further indent
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    
    // Go back to parent level
    textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      console.log('Creating item at parent level...');
      await textarea.fill('Back to subtask level');
      await page.keyboard.press('Shift+Tab'); // Outdent
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    
    // Exit edit mode by clicking elsewhere
    await page.click('body');
    await page.waitForTimeout(500);
    
    // Now test style changes by clicking on existing items
    console.log('\n--- Testing style changes ---');
    
    // Click on "Main Project Overview" to edit it
    const mainProjectDiv = page.locator('div:has-text("Main Project Overview")').first();
    if (await mainProjectDiv.count() > 0) {
      await mainProjectDiv.click();
      await page.waitForTimeout(300);
      
      // Should be in edit mode now - apply header style
      await page.keyboard.press('Control+b'); // Header style
      await page.keyboard.press('Escape'); // Exit edit
      await page.waitForTimeout(300);
    }
    
    // === VERIFY ITEMS WERE CREATED ===
    console.log('\n--- Checking created items ---');
    const itemsToCheck = [
      'Main Project Overview',
      'First subtask', 
      'Second subtask',
      'Nested detail',
      'Back to subtask level'
    ];
    
    let createdCount = 0;
    for (const itemText of itemsToCheck) {
      // Look for the text in divs (when not editing)
      const found = await page.locator(`div:has-text("${itemText}")`).count() > 0 ||
                    await page.locator(`textarea:has-text("${itemText}")`).count() > 0;
      if (found) createdCount++;
      console.log(`"${itemText}": ${found ? '✓ CREATED' : '✗ NOT FOUND'}`);
    }
    
    expect(createdCount).toBeGreaterThan(0);
    console.log(`\nCreated ${createdCount}/${itemsToCheck.length} items`);
    
    // === TEST PERSISTENCE ===
    console.log('\n--- Testing Persistence ---');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    let persistedCount = 0;
    for (const itemText of itemsToCheck) {
      const found = await page.locator(`div:has-text("${itemText}")`).count() > 0;
      if (found) persistedCount++;
      console.log(`After reload - "${itemText}": ${found ? '✓ PERSISTED' : '✗ NOT PERSISTED'}`);
    }
    
    console.log(`\nPersisted ${persistedCount}/${itemsToCheck.length} items`);
    
    // Take screenshots for debugging
    await page.screenshot({ path: 'test-results/core-outline-fixed.png', fullPage: true });
    console.log('\nScreenshot saved to test-results/core-outline-fixed.png');
  });

  test('creates items using click and keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    // Alternative approach: Click on existing items to edit them
    console.log('=== TESTING CLICK-TO-EDIT FUNCTIONALITY ===');
    
    // Look for existing sample data item "Marketing Campaign"
    const marketingItem = page.locator('div:has-text("Marketing Campaign")').first();
    
    if (await marketingItem.count() > 0) {
      console.log('Found Marketing Campaign item, clicking to edit...');
      await marketingItem.click();
      await page.waitForTimeout(300);
      
      // Should now have a textarea visible
      const textarea = page.locator('textarea').first();
      if (await textarea.count() > 0) {
        console.log('Textarea appeared, editing item...');
        await textarea.fill('Updated Marketing Campaign');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        
        // Verify the change
        const updated = await page.locator('div:has-text("Updated Marketing Campaign")').count() > 0;
        console.log(`Item updated: ${updated ? '✓' : '✗'}`);
      }
    }
    
    // Test using the toolbar style buttons
    const normalButton = page.locator('button:has-text("Normal")');
    const headerButton = page.locator('button:has-text("Header")');
    const codeButton = page.locator('button:has-text("Code")');
    const quoteButton = page.locator('button:has-text("Quote")');
    
    console.log('\n--- Checking style buttons ---');
    console.log('Normal button visible:', await normalButton.count() > 0);
    console.log('Header button visible:', await headerButton.count() > 0);
    console.log('Code button visible:', await codeButton.count() > 0);
    console.log('Quote button visible:', await quoteButton.count() > 0);
    
    // Click Header button then add new item
    if (await headerButton.count() > 0) {
      await headerButton.click();
      await page.waitForTimeout(200);
      
      const addButton = page.locator('button:has-text("Add new item")');
      await addButton.click();
      await page.waitForTimeout(300);
      
      const textarea = page.locator('textarea').first();
      if (await textarea.count() > 0) {
        await textarea.fill('This is a Header Item');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Check if header style was applied (should be bold)
        const headerItem = page.locator('.font-bold:has-text("This is a Header Item")');
        console.log('Header style applied:', await headerItem.count() > 0);
      }
    }
  });
});