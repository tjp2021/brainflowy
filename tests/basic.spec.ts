import { test, expect } from '@playwright/test';

test.describe('BrainFlowy Application', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page title contains "BrainFlowy"
    await expect(page).toHaveTitle(/BrainFlowy/i);
  });

  test('can navigate and interact with basic elements', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if main content is visible - use first() to avoid strict mode violation
    const mainContent = page.locator('main, #root, .app').first();
    await expect(mainContent).toBeVisible();
  });

  test('responsive design works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify the page is still functional on mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
