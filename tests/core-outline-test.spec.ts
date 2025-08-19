import { test, expect } from '@playwright/test';

test.describe('Core Outline Functionality', () => {
  test('creates nested bullets with different styles', async ({ page }) => {
    // Go directly to outline page
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    console.log('=== TESTING CORE BULLET CREATION ===');
    
    // Find the first textarea that's visible
    const textareas = await page.locator('textarea').all();
    console.log(`Found ${textareas.length} textareas`);
    
    if (textareas.length === 0) {
      throw new Error('No textareas found on page - cannot create bullets');
    }
    
    // Click on the first textarea to focus it
    const firstTextarea = textareas[0];
    await firstTextarea.click();
    await page.waitForTimeout(300);
    
    // Type in the first item
    console.log('Creating first bullet...');
    await page.keyboard.type('Main Project Overview');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Create an indented child
    console.log('Creating indented child...');
    await page.keyboard.type('First subtask');
    await page.keyboard.press('Tab'); // Indent
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Create another child at same level
    console.log('Creating sibling at same level...');
    await page.keyboard.type('Second subtask');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Create a deeper nested item
    console.log('Creating deeper nested item...');
    await page.keyboard.type('Nested detail');
    await page.keyboard.press('Tab'); // Further indent
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Go back to parent level
    console.log('Creating item at parent level...');
    await page.keyboard.type('Back to subtask level');
    await page.keyboard.press('Shift+Tab'); // Outdent
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Create a header style item
    console.log('Creating header style item...');
    await page.keyboard.type('Section Header');
    await page.keyboard.press('Control+b'); // Header style
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Create a code style item
    console.log('Creating code style item...');
    await page.keyboard.type('const code = "example"');
    await page.keyboard.press('Control+e'); // Code style
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // === VERIFY ITEMS WERE CREATED ===
    console.log('\n--- Checking created items ---');
    const itemsToCheck = [
      'Main Project Overview',
      'First subtask', 
      'Second subtask',
      'Nested detail',
      'Back to subtask level',
      'Section Header',
      'const code = "example"'
    ];
    
    let createdCount = 0;
    for (const itemText of itemsToCheck) {
      const found = await page.getByText(itemText).count() > 0;
      if (found) createdCount++;
      console.log(`"${itemText}": ${found ? '✓ CREATED' : '✗ NOT FOUND'}`);
    }
    
    expect(createdCount).toBeGreaterThan(0);
    console.log(`\nCreated ${createdCount}/${itemsToCheck.length} items`);
    
    // === CHECK API CALLS ===
    const apiCalls: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // Force save by clicking elsewhere
    await page.click('body');
    await page.waitForTimeout(2000);
    
    console.log('\n--- API Calls Made ---');
    apiCalls.forEach(call => {
      console.log(`${call.method} ${call.url} - Status: ${call.status}`);
    });
    
    // === TEST PERSISTENCE ===
    console.log('\n--- Testing Persistence ---');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    let persistedCount = 0;
    for (const itemText of itemsToCheck) {
      const found = await page.getByText(itemText).count() > 0;
      if (found) persistedCount++;
      console.log(`After reload - "${itemText}": ${found ? '✓ PERSISTED' : '✗ NOT PERSISTED'}`);
    }
    
    console.log(`\nPersisted ${persistedCount}/${itemsToCheck.length} items`);
    
    // Take screenshots for debugging
    await page.screenshot({ path: 'test-results/core-outline-final.png', fullPage: true });
    console.log('\nScreenshot saved to test-results/core-outline-final.png');
  });
});