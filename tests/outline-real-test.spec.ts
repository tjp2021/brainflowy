import { test, expect } from '@playwright/test';

test.describe('Real Outline Functionality Test', () => {
  test('interact with actual outline interface', async ({ page }) => {
    // Navigate to outline page
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    console.log('=== TESTING REAL OUTLINE INTERFACE ===');
    
    // Take a screenshot to see what we're working with
    await page.screenshot({ path: 'outline-page-actual.png' });
    
    // Based on the test output, we can see there are existing items like:
    // "Marketing Campaign", "Social Media Strategy", "Instagram content calendar"
    
    // Try to find existing outline items
    const existingItems = await page.locator('text="Marketing Campaign"').count();
    console.log('Found "Marketing Campaign":', existingItems > 0);
    
    // Look for any textarea or input that might be editable
    const textareas = await page.locator('textarea').count();
    console.log('Number of textareas found:', textareas);
    
    // Try double-clicking on an existing item to edit it
    const marketingItem = page.locator('text="Marketing Campaign"').first();
    if (await marketingItem.count() > 0) {
      console.log('Double-clicking on Marketing Campaign item...');
      await marketingItem.dblclick();
      await page.waitForTimeout(500);
      
      // Check if any input became focused
      const focusedInput = page.locator('textarea:focus, input:focus');
      const hasFocus = await focusedInput.count() > 0;
      console.log('Input focused after double-click:', hasFocus);
      
      if (hasFocus) {
        console.log('Typing new text...');
        await focusedInput.first().fill('Updated Marketing Campaign');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        // Check if the text was updated
        const updatedItem = await page.locator('text="Updated Marketing Campaign"').count();
        console.log('Item updated:', updatedItem > 0);
      }
    }
    
    // Try to find the plus button to add new items
    const plusButtons = page.locator('svg.lucide-plus').locator('..');
    const plusButtonCount = await plusButtons.count();
    console.log('Plus buttons found:', plusButtonCount);
    
    if (plusButtonCount > 0) {
      console.log('Clicking plus button...');
      await plusButtons.first().click();
      await page.waitForTimeout(500);
      
      // Look for newly focused input
      const newInput = page.locator('textarea:focus, input:focus');
      if (await newInput.count() > 0) {
        console.log('New input appeared, typing...');
        
        // Test 1: Create a normal item
        await newInput.first().fill('Test Item - Normal Style');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        // Test 2: Create an indented item
        const nextInput = page.locator('textarea:focus, input:focus');
        if (await nextInput.count() > 0) {
          await nextInput.first().fill('Test Item - Indented Child');
          await page.keyboard.press('Tab'); // Indent
          console.log('Pressed Tab to indent');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        }
        
        // Test 3: Create a header style item
        const headerInput = page.locator('textarea:focus, input:focus');
        if (await headerInput.count() > 0) {
          await headerInput.first().fill('Test Item - Header Style');
          await page.keyboard.press('Control+b'); // Make it a header
          console.log('Pressed Ctrl+B for header style');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        }
        
        // Test 4: Create a code style item
        const codeInput = page.locator('textarea:focus, input:focus');
        if (await codeInput.count() > 0) {
          await codeInput.first().fill('const test = "code style"');
          await page.keyboard.press('Control+e'); // Make it code
          console.log('Pressed Ctrl+E for code style');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // === VERIFY OUR ITEMS WERE CREATED ===
    console.log('\n--- Checking if items were created ---');
    const itemsToCheck = [
      'Test Item - Normal Style',
      'Test Item - Indented Child',
      'Test Item - Header Style',
      'const test = "code style"'
    ];
    
    for (const item of itemsToCheck) {
      const found = await page.locator(`text="${item}"`).count() > 0;
      console.log(`"${item}": ${found ? 'CREATED ✓' : 'NOT FOUND ✗'}`);
    }
    
    // === CHECK HIERARCHY ===
    const normalItem = page.locator('text="Test Item - Normal Style"').first();
    const indentedItem = page.locator('text="Test Item - Indented Child"').first();
    
    if (await normalItem.count() > 0 && await indentedItem.count() > 0) {
      const normalBox = await normalItem.boundingBox();
      const indentedBox = await indentedItem.boundingBox();
      
      if (normalBox && indentedBox) {
        const isIndented = indentedBox.x > normalBox.x;
        console.log(`\nIndentation check: Child item ${isIndented ? 'IS' : 'IS NOT'} indented`);
        console.log(`Parent X: ${normalBox.x}, Child X: ${indentedBox.x}`);
      }
    }
    
    // === TEST PERSISTENCE ===
    console.log('\n--- Testing persistence ---');
    
    // Count items before reload
    const itemsBeforeReload = await page.locator('.outline-item, textarea').count();
    console.log('Items before reload:', itemsBeforeReload);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Count items after reload
    const itemsAfterReload = await page.locator('.outline-item, textarea').count();
    console.log('Items after reload:', itemsAfterReload);
    
    // Check if our test items persisted
    console.log('\n--- Checking persistence of test items ---');
    for (const item of itemsToCheck) {
      const persisted = await page.locator(`text="${item}"`).count() > 0;
      console.log(`"${item}": ${persisted ? 'PERSISTED ✓' : 'NOT PERSISTED ✗'}`);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'outline-page-after-test.png' });
    console.log('\nScreenshots saved: outline-page-actual.png and outline-page-after-test.png');
  });
});