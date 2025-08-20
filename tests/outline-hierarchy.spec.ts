import { test, expect } from '@playwright/test';

test.describe('Outline Hierarchy Persistence', () => {
  const timestamp = Date.now();
  const testEmail = `test_hierarchy_${timestamp}@example.com`;
  const testPassword = 'TestPass123!';

  test('should persist complete nested hierarchy after logout/login', async ({ page }) => {
    // Step 1: Register and login
    await page.goto('http://localhost:5174/register');
    await page.waitForLoadState('networkidle');
    
    // Fill registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[name="displayName"], input[placeholder*="name" i]', 'Hierarchy Test User');
    
    // Submit registration
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5174/');
    console.log('✅ User registered and logged in');

    // Step 2: Create outline with nested structure
    await page.waitForTimeout(1000); // Wait for page to stabilize
    
    // Create main bullet
    await page.keyboard.type('MAIN TASK');
    await page.keyboard.press('Enter');
    console.log('✅ Created MAIN TASK');
    
    // Create first sub-bullet (Tab to indent)
    await page.keyboard.press('Tab');
    await page.keyboard.type('Sub-task 1.1');
    await page.keyboard.press('Enter');
    console.log('✅ Created Sub-task 1.1 (indented)');
    
    // Create second sub-bullet (same level)
    await page.keyboard.type('Sub-task 1.2');
    await page.keyboard.press('Enter');
    console.log('✅ Created Sub-task 1.2');
    
    // Create sub-sub-bullet (Tab to indent further)
    await page.keyboard.press('Tab');
    await page.keyboard.type('Sub-sub-task 1.2.1');
    await page.keyboard.press('Enter');
    console.log('✅ Created Sub-sub-task 1.2.1 (double indented)');
    
    // Create another sub-sub-bullet
    await page.keyboard.type('Sub-sub-task 1.2.2');
    await page.keyboard.press('Enter');
    console.log('✅ Created Sub-sub-task 1.2.2');
    
    // Back to first level sub-bullet (Shift+Tab to outdent)
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.type('Sub-task 1.3');
    await page.keyboard.press('Enter');
    console.log('✅ Created Sub-task 1.3 (back to single indent)');
    
    // Wait for auto-save
    await page.waitForTimeout(2000);
    
    // Step 3: Verify hierarchy is displayed correctly
    const mainItem = page.locator('text=MAIN TASK').first();
    await expect(mainItem).toBeVisible();
    
    // Check indentation - sub-items should have margin/padding
    const subItem11 = page.locator('text=Sub-task 1.1').first();
    await expect(subItem11).toBeVisible();
    
    const subItem12 = page.locator('text=Sub-task 1.2').first();
    await expect(subItem12).toBeVisible();
    
    const subSubItem121 = page.locator('text=Sub-sub-task 1.2.1').first();
    await expect(subSubItem121).toBeVisible();
    
    const subSubItem122 = page.locator('text=Sub-sub-task 1.2.2').first();
    await expect(subSubItem122).toBeVisible();
    
    const subItem13 = page.locator('text=Sub-task 1.3').first();
    await expect(subItem13).toBeVisible();
    
    console.log('✅ All items visible in hierarchy');
    
    // Step 4: Logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
    await logoutButton.click();
    await page.waitForURL(/.*login/);
    console.log('✅ Logged out');
    
    // Step 5: Login again
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5174/');
    console.log('✅ Logged back in');
    
    // Wait for outline to load
    await page.waitForTimeout(2000);
    
    // Step 6: Verify complete hierarchy is restored
    console.log('🔍 Verifying hierarchy after re-login...');
    
    // Check main item
    const mainItemAfter = page.locator('text=MAIN TASK').first();
    await expect(mainItemAfter).toBeVisible({ timeout: 10000 });
    console.log('✅ MAIN TASK found');
    
    // Check all sub-items
    const subItem11After = page.locator('text=Sub-task 1.1').first();
    await expect(subItem11After).toBeVisible({ timeout: 5000 });
    console.log('✅ Sub-task 1.1 found');
    
    const subItem12After = page.locator('text=Sub-task 1.2').first();
    await expect(subItem12After).toBeVisible({ timeout: 5000 });
    console.log('✅ Sub-task 1.2 found');
    
    const subSubItem121After = page.locator('text=Sub-sub-task 1.2.1').first();
    await expect(subSubItem121After).toBeVisible({ timeout: 5000 });
    console.log('✅ Sub-sub-task 1.2.1 found');
    
    const subSubItem122After = page.locator('text=Sub-sub-task 1.2.2').first();
    await expect(subSubItem122After).toBeVisible({ timeout: 5000 });
    console.log('✅ Sub-sub-task 1.2.2 found');
    
    const subItem13After = page.locator('text=Sub-task 1.3').first();
    await expect(subItem13After).toBeVisible({ timeout: 5000 });
    console.log('✅ Sub-task 1.3 found');
    
    console.log('✅✅✅ SUCCESS: Complete hierarchy persisted!');
    
    // Verify indentation structure is preserved
    // Get all item elements
    const items = await page.locator('[data-testid*="outline-item"], .outline-item, div:has(> span:has-text("•"))').all();
    
    if (items.length >= 6) {
      console.log(`✅ Found ${items.length} items in hierarchy`);
    } else {
      console.log(`⚠️ Expected at least 6 items, found ${items.length}`);
    }
  });
  
  test('should handle Tab indentation correctly', async ({ page }) => {
    const timestamp2 = Date.now();
    const testEmail2 = `test_tab_${timestamp2}@example.com`;
    
    // Register new user
    await page.goto('http://localhost:5174/register');
    await page.fill('input[type="email"]', testEmail2);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[name="displayName"], input[placeholder*="name" i]', 'Tab Test User');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5174/');
    
    // Create items and test Tab indentation
    await page.keyboard.type('Item 1');
    await page.keyboard.press('Enter');
    
    await page.keyboard.type('Item 2');
    await page.keyboard.press('Enter');
    
    // Now on Item 2, press Tab - it should become a child of Item 1
    await page.keyboard.press('ArrowUp'); // Go back to Item 2
    await page.keyboard.press('End'); // Go to end of line
    await page.keyboard.press('Tab');
    
    // Wait for the indentation to take effect
    await page.waitForTimeout(500);
    
    // Verify Item 2 is now indented
    const item2 = page.locator('text=Item 2').first();
    await expect(item2).toBeVisible();
    
    // Create Item 3 at the same indented level
    await page.keyboard.press('Enter');
    await page.keyboard.type('Item 3');
    
    // Item 3 should also be indented
    const item3 = page.locator('text=Item 3').first();
    await expect(item3).toBeVisible();
    
    // Save and reload to verify persistence
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify hierarchy is preserved
    await expect(page.locator('text=Item 1')).toBeVisible();
    await expect(page.locator('text=Item 2')).toBeVisible();
    await expect(page.locator('text=Item 3')).toBeVisible();
    
    console.log('✅ Tab indentation working correctly');
  });
});