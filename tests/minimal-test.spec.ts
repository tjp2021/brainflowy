import { test, expect } from '@playwright/test';

test('Minimal registration test', async ({ page }) => {
  const timestamp = Date.now();
  const email = `min_${timestamp}@example.com`;
  
  // Register EXACTLY like working test
  await page.goto('http://localhost:5173/register');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.fill('input[placeholder*="name" i]', 'Test User');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Go to main page EXACTLY like working test
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  // Try to create an item EXACTLY like working test
  await page.keyboard.type('Test item');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  
  // Check if item exists
  const itemExists = await page.locator('text=Test item').first().isVisible().catch(() => false);
  
  if (itemExists) {
    console.log('✅ SUCCESS: Registration worked and item created');
  } else {
    console.log('❌ FAIL: Item not created');
    
    // Check for logout button
    const logoutExists = await page.locator('button:has-text("Logout")').first().isVisible().catch(() => false);
    console.log('Logout button visible:', logoutExists);
    
    // Check current URL
    console.log('Current URL:', page.url());
  }
});