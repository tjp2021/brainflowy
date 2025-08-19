import { test, expect } from '@playwright/test';

test('03: Activate input by clicking existing item', async ({ page }) => {
  console.log('TEST 03: Trying to activate input field');
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Strategy 1: Double-click on existing text to edit
  const marketingText = page.getByText('Marketing Campaign');
  if (await marketingText.count() > 0) {
    console.log('Found "Marketing Campaign", double-clicking...');
    await marketingText.first().dblclick();
    await page.waitForTimeout(500);
    
    const focusedElement = await page.locator(':focus').count();
    console.log('Elements with focus after double-click:', focusedElement);
  }
  
  // Strategy 2: Click on any element that looks like an outline item
  const itemElements = await page.locator('[class*="outline"], [class*="item"]').all();
  console.log(`Found ${itemElements.length} potential outline elements`);
  
  if (itemElements.length > 0) {
    console.log('Clicking first outline element...');
    await itemElements[0].click();
    await page.waitForTimeout(500);
    
    // Check if any input became visible
    const visibleTextarea = await page.locator('textarea:visible').count();
    const visibleInput = await page.locator('input:visible').count();
    console.log('Visible textareas after click:', visibleTextarea);
    console.log('Visible inputs after click:', visibleInput);
  }
  
  // Strategy 3: Try keyboard navigation
  console.log('Trying Tab key to focus an element...');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  
  const focusedAfterTab = await page.locator(':focus').count();
  console.log('Focused elements after Tab:', focusedAfterTab);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/03-after-activation.png' });
});