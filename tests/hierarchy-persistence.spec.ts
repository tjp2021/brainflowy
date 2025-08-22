import { test, expect } from '@playwright/test';

test.describe('Hierarchy Persistence', () => {
  test('should persist nested hierarchy after logout and login', async ({ page }) => {
    // Generate unique test credentials
    const timestamp = Date.now();
    const testEmail = `test_${timestamp}@example.com`;
    const testPassword = 'TestPass123!';
    
    // Step 1: Register and login
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('networkidle');
    
    // Fill registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[name="displayName"], input[placeholder*="name" i]', 'Test User');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for navigation after registration
    await page.waitForURL('http://localhost:5173/**', { timeout: 10000 });
    
    // Navigate to main page if needed
    const currentUrl = page.url();
    if (!currentUrl.endsWith('/')) {
      await page.goto('http://localhost:5173/');
    }
    
    await page.waitForTimeout(2000); // Let the page stabilize
    
    // Step 2: Create nested hierarchy
    console.log('Creating nested hierarchy...');
    
    // Create MAIN TASK
    await page.keyboard.type('MAIN TASK');
    await page.keyboard.press('Enter');
    
    // Create Sub-task 1.1 (indented)
    await page.keyboard.press('Tab');
    await page.keyboard.type('Sub-task 1.1');
    await page.keyboard.press('Enter');
    
    // Create Sub-task 1.2 (same level)
    await page.keyboard.type('Sub-task 1.2');
    await page.keyboard.press('Enter');
    
    // Create Sub-sub-task 1.2.1 (double indented)
    await page.keyboard.press('Tab');
    await page.keyboard.type('Sub-sub-task 1.2.1');
    await page.keyboard.press('Enter');
    
    // Create Sub-sub-task 1.2.2 (same level)
    await page.keyboard.type('Sub-sub-task 1.2.2');
    await page.keyboard.press('Enter');
    
    // Create Sub-task 1.3 (back to single indent)
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.type('Sub-task 1.3');
    
    // Wait for auto-save
    await page.waitForTimeout(3000);
    
    // Step 3: Verify hierarchy is displayed correctly BEFORE logout
    console.log('Verifying hierarchy before logout...');
    
    // Check that all items exist
    await expect(page.locator('text=MAIN TASK')).toBeVisible();
    await expect(page.locator('text=Sub-task 1.1')).toBeVisible();
    await expect(page.locator('text=Sub-task 1.2')).toBeVisible();
    await expect(page.locator('text=Sub-sub-task 1.2.1')).toBeVisible();
    await expect(page.locator('text=Sub-sub-task 1.2.2')).toBeVisible();
    await expect(page.locator('text=Sub-task 1.3')).toBeVisible();
    
    // Verify indentation by checking padding-left styles
    const mainTask = page.locator('text=MAIN TASK').locator('xpath=ancestor::div[contains(@style, "padding")]').first();
    const subTask11 = page.locator('text=Sub-task 1.1').locator('xpath=ancestor::div[contains(@style, "padding")]').first();
    const subSubTask121 = page.locator('text=Sub-sub-task 1.2.1').locator('xpath=ancestor::div[contains(@style, "padding")]').first();
    
    // Get padding values
    const mainPadding = await mainTask.evaluate(el => window.getComputedStyle(el).paddingLeft);
    const sub11Padding = await subTask11.evaluate(el => window.getComputedStyle(el).paddingLeft);
    const subSub121Padding = await subSubTask121.evaluate(el => window.getComputedStyle(el).paddingLeft);
    
    console.log('Padding before logout:', { mainPadding, sub11Padding, subSub121Padding });
    
    // Step 4: Logout
    console.log('Logging out...');
    const logoutButton = page.locator('button:has-text("Logout")').first();
    await logoutButton.click();
    await page.waitForURL(/.*login/, { timeout: 10000 });
    
    // Step 5: Login again with same credentials
    console.log('Logging back in...');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('http://localhost:5173/**', { timeout: 10000 });
    
    // Navigate to main page if needed
    const urlAfterLogin = page.url();
    if (!urlAfterLogin.endsWith('/')) {
      await page.goto('http://localhost:5173/');
    }
    
    await page.waitForTimeout(3000); // Let the outline load
    
    // Step 6: Verify hierarchy is preserved AFTER login
    console.log('Verifying hierarchy after login...');
    
    // Check that all items still exist
    await expect(page.locator('text=MAIN TASK')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Sub-task 1.1')).toBeVisible();
    await expect(page.locator('text=Sub-task 1.2')).toBeVisible();
    await expect(page.locator('text=Sub-sub-task 1.2.1')).toBeVisible();
    await expect(page.locator('text=Sub-sub-task 1.2.2')).toBeVisible();
    await expect(page.locator('text=Sub-task 1.3')).toBeVisible();
    
    // Verify indentation is preserved
    const mainTaskAfter = page.locator('text=MAIN TASK').locator('xpath=ancestor::div[contains(@style, "padding")]').first();
    const subTask11After = page.locator('text=Sub-task 1.1').locator('xpath=ancestor::div[contains(@style, "padding")]').first();
    const subSubTask121After = page.locator('text=Sub-sub-task 1.2.1').locator('xpath=ancestor::div[contains(@style, "padding")]').first();
    
    // Get padding values after login
    const mainPaddingAfter = await mainTaskAfter.evaluate(el => window.getComputedStyle(el).paddingLeft);
    const sub11PaddingAfter = await subTask11After.evaluate(el => window.getComputedStyle(el).paddingLeft);
    const subSub121PaddingAfter = await subSubTask121After.evaluate(el => window.getComputedStyle(el).paddingLeft);
    
    console.log('Padding after login:', { 
      mainPaddingAfter, 
      sub11PaddingAfter, 
      subSub121PaddingAfter 
    });
    
    // Parse padding values to numbers
    const parsePixels = (px: string) => parseInt(px.replace('px', ''));
    
    const mainPx = parsePixels(mainPaddingAfter);
    const sub11Px = parsePixels(sub11PaddingAfter);
    const subSub121Px = parsePixels(subSub121PaddingAfter);
    
    // Verify hierarchy levels are correct
    // Sub-task should have more padding than main
    expect(sub11Px).toBeGreaterThan(mainPx);
    
    // Sub-sub-task should have more padding than sub-task
    expect(subSub121Px).toBeGreaterThan(sub11Px);
    
    // Verify expected indentation levels (24px per level)
    expect(sub11Px - mainPx).toBeGreaterThanOrEqual(20); // Should be ~24px difference
    expect(subSub121Px - sub11Px).toBeGreaterThanOrEqual(20); // Should be ~24px difference
    
    console.log('✅ Hierarchy persistence test PASSED!');
    console.log('All items preserved with correct indentation levels');
  });
});