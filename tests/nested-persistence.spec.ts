import { test, expect } from '@playwright/test';

test.describe('Nested Items Persistence', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';

  test('should persist nested bullet structure after logout and login', async ({ page }) => {
    // 1. Register a new user
    await page.goto('http://localhost:5173/');
    await page.click('text=Get Started');
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button:has-text("Sign Up")');
    
    // Wait for redirect to outline page
    await page.waitForURL('**/outlines');
    
    // 2. Create a hierarchical structure
    // Main bullet
    await page.click('button:has-text("Add new item")');
    await page.keyboard.type('Main Task');
    await page.keyboard.press('Enter');
    
    // First sub-bullet (indent with Tab)
    await page.keyboard.type('Subtask 1');
    await page.keyboard.press('Tab'); // Indent to make it a child
    await page.keyboard.press('Enter');
    
    // Second sub-bullet at same level
    await page.keyboard.type('Subtask 2');
    await page.keyboard.press('Enter');
    
    // Sub-sub-bullet (indent again)
    await page.keyboard.type('Sub-subtask 2.1');
    await page.keyboard.press('Tab'); // Indent further
    await page.keyboard.press('Enter');
    
    // Another sub-sub-bullet
    await page.keyboard.type('Sub-subtask 2.2');
    await page.keyboard.press('Enter');
    
    // Back to sub-bullet level (outdent)
    await page.keyboard.type('Subtask 3');
    await page.keyboard.press('Shift+Tab'); // Outdent back to sub-bullet level
    await page.keyboard.press('Enter');
    
    // Another main bullet
    await page.keyboard.type('Another Main Task');
    await page.keyboard.press('Shift+Tab'); // Outdent to main level
    await page.keyboard.press('Escape'); // Exit editing
    
    // Wait a moment for saves to complete
    await page.waitForTimeout(2000);
    
    // Take a screenshot of the created structure
    await page.screenshot({ path: 'test-results/before-logout.png', fullPage: true });
    
    // 3. Count the items before logout
    // Use a more generic selector for outline items
    const itemsBeforeLogout = await page.locator('.outline-item, [data-outline-item], div:has(> textarea)').count();
    console.log(`Items before logout: ${itemsBeforeLogout}`);
    // Should have at least 7 items
    expect(itemsBeforeLogout).toBeGreaterThanOrEqual(7);
    
    // Verify the structure visually
    await expect(page.locator('text=Main Task')).toBeVisible();
    await expect(page.locator('text=Subtask 1')).toBeVisible();
    await expect(page.locator('text=Subtask 2')).toBeVisible();
    await expect(page.locator('text=Sub-subtask 2.1')).toBeVisible();
    await expect(page.locator('text=Sub-subtask 2.2')).toBeVisible();
    await expect(page.locator('text=Subtask 3')).toBeVisible();
    await expect(page.locator('text=Another Main Task')).toBeVisible();
    
    // 4. Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/');
    
    // 5. Login back
    await page.click('text=Sign In');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In")');
    
    // Wait for outline page to load
    await page.waitForURL('**/outlines');
    await page.waitForTimeout(2000); // Wait for data to load
    
    // Take a screenshot after login
    await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });
    
    // 6. Verify all items are still there
    const itemsAfterLogin = await page.locator('.outline-item, [data-outline-item], div:has(> textarea)').count();
    console.log(`Items after login: ${itemsAfterLogin}`);
    expect(itemsAfterLogin).toBeGreaterThanOrEqual(7); // Should still have at least 7 items
    
    // Verify each item is still visible
    await expect(page.locator('text=Main Task')).toBeVisible();
    await expect(page.locator('text=Subtask 1')).toBeVisible();
    await expect(page.locator('text=Subtask 2')).toBeVisible();
    await expect(page.locator('text=Sub-subtask 2.1')).toBeVisible();
    await expect(page.locator('text=Sub-subtask 2.2')).toBeVisible();
    await expect(page.locator('text=Subtask 3')).toBeVisible();
    await expect(page.locator('text=Another Main Task')).toBeVisible();
    
    // 7. Verify the hierarchy is preserved (check indentation)
    // This would require checking CSS classes or styles that indicate nesting level
    const mainTask = page.locator('text=Main Task').first();
    const subtask1 = page.locator('text=Subtask 1').first();
    const subSubtask = page.locator('text=Sub-subtask 2.1').first();
    
    // Get positions to verify indentation
    const mainTaskBox = await mainTask.boundingBox();
    const subtask1Box = await subtask1.boundingBox();
    const subSubtaskBox = await subSubtask.boundingBox();
    
    if (mainTaskBox && subtask1Box && subSubtaskBox) {
      // Subtask should be indented relative to main task
      expect(subtask1Box.x).toBeGreaterThan(mainTaskBox.x);
      // Sub-subtask should be further indented
      expect(subSubtaskBox.x).toBeGreaterThan(subtask1Box.x);
    }
    
    console.log('✅ All nested items persisted correctly!');
  });
});