import { test, expect } from '@playwright/test';

test('01: App loads and shows outline page', async ({ page }) => {
  console.log('TEST 01: Basic page load');
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Check page loaded
  const title = await page.title();
  console.log('Page title:', title);
  expect(title).toContain('BrainFlowy');
  
  // Check for main content
  const pageText = await page.locator('body').innerText();
  console.log('Page contains "My Outlines":', pageText.includes('My Outlines'));
  expect(pageText).toContain('My Outlines');
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/01-page-loaded.png' });
  console.log('✓ Page loads successfully');
});