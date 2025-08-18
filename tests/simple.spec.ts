import { test, expect } from '@playwright/test';

test('check app loads', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Page error:', err.message));
  
  await page.goto('http://localhost:5176');
  await page.waitForTimeout(2000);
  
  // Check if React app root exists
  const root = await page.locator('#root').count();
  console.log('Root element found:', root);
  
  // Check current URL
  console.log('Current URL:', page.url());
  
  // Try to get any text content
  const bodyHtml = await page.locator('body').innerHTML();
  console.log('Body HTML (first 500 chars):', bodyHtml.substring(0, 500));
});

test('check login page directly', async ({ page }) => {
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Page error:', err.message));
  
  await page.goto('http://localhost:5176/login');
  await page.waitForTimeout(2000);
  
  const bodyHtml = await page.locator('body').innerHTML();
  console.log('Login page HTML (first 500 chars):', bodyHtml.substring(0, 500));
});