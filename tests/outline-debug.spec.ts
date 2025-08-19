import { test, expect } from '@playwright/test';

test('debug outline functionality', async ({ page }) => {
  // Listen for console messages and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/api')) {
      console.log('API REQUEST:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api')) {
      console.log('API RESPONSE:', response.status(), response.url());
    }
  });
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  console.log('=== DEBUGGING OUTLINE CREATION ===');
  
  // Try to add a new item by clicking plus button
  const plusButton = page.locator('svg.lucide-plus').locator('..').first();
  if (await plusButton.count() > 0) {
    console.log('Clicking plus button...');
    await plusButton.click();
    await page.waitForTimeout(500);
    
    // Check for focused input
    const focusedInput = page.locator('textarea:focus, input:focus');
    if (await focusedInput.count() > 0) {
      console.log('Input is focused, typing text...');
      await focusedInput.first().fill('Debug Test Item');
      
      console.log('Pressing Enter to save...');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000); // Wait for any API calls
      
      // Check if item was created
      const createdItem = await page.locator('text="Debug Test Item"').count();
      console.log('Item created in DOM:', createdItem > 0);
      
      // Try to create a child item
      const nextInput = page.locator('textarea:focus, input:focus');
      if (await nextInput.count() > 0) {
        console.log('Creating child item...');
        await nextInput.first().fill('Debug Child Item');
        console.log('Pressing Tab to indent...');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);
        console.log('Pressing Enter to save child...');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        const childItem = await page.locator('text="Debug Child Item"').count();
        console.log('Child item created in DOM:', childItem > 0);
      }
    } else {
      console.log('ERROR: No input became focused after clicking plus button');
    }
  }
  
  // Check what's actually in the DOM
  const allTextareas = await page.locator('textarea').all();
  console.log(`\nTotal textareas in DOM: ${allTextareas.length}`);
  
  for (let i = 0; i < Math.min(3, allTextareas.length); i++) {
    const value = await allTextareas[i].inputValue();
    const isVisible = await allTextareas[i].isVisible();
    console.log(`Textarea ${i}: visible=${isVisible}, value="${value}"`);
  }
  
  // Check for any error messages in the UI
  const errorElements = page.locator('.error, .error-message, [role="alert"]');
  const errorCount = await errorElements.count();
  if (errorCount > 0) {
    console.log('\nERRORS FOUND IN UI:');
    for (let i = 0; i < errorCount; i++) {
      const errorText = await errorElements.nth(i).textContent();
      console.log(`Error ${i}: ${errorText}`);
    }
  }
  
  console.log('\n=== END DEBUG ===');
});