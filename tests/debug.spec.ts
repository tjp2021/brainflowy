import { test, expect } from '@playwright/test';

test.describe('Debug Tests', () => {
  test('check what is on login page', async ({ page }) => {
    await page.goto('http://localhost:5176/login');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'login-page.png' });
    
    // Get page content
    const content = await page.content();
    console.log('Page URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check what's visible
    const h1 = await page.locator('h1').textContent();
    console.log('H1 content:', h1);
    
    // Check for any inputs
    const inputs = await page.locator('input').count();
    console.log('Number of inputs found:', inputs);
    
    // Get all visible text
    const bodyText = await page.locator('body').innerText();
    console.log('Body text:', bodyText.substring(0, 500));
  });
});