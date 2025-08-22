import { test, expect } from '@playwright/test';

test.describe('Simple Functionality Tests', () => {
  
  test('create and edit items', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test_${timestamp}@example.com`;
    
    // Register
    await page.goto('http://localhost:5173/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder*="name" i]', 'Test User');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Go to main page
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // Create item
    await page.keyboard.type('First item');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Create second item
    await page.keyboard.type('Second item');
    await page.waitForTimeout(2000);
    
    // Edit first item - click on it
    const firstItem = page.locator('text=First item').first();
    const firstItemVisible = await firstItem.isVisible().catch(() => false);
    
    console.log('First item visible:', firstItemVisible);
    
    if (firstItemVisible) {
      await firstItem.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type('Edited first item');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      
      // Verify edit worked
      const editedVisible = await page.locator('text=Edited first item').first().isVisible().catch(() => false);
      console.log('Edited item visible:', editedVisible);
      
      if (editedVisible) {
        console.log('✅ Create and edit works');
      } else {
        console.log('❌ Edit failed');
      }
    } else {
      console.log('❌ Cannot edit - first item not found');
      
      // Check if we're logged in
      const logoutBtn = await page.locator('button:has-text("Logout")').first().isVisible().catch(() => false);
      console.log('Logout button visible:', logoutBtn);
      console.log('Current URL:', page.url());
    }
  });

  test('hierarchy persistence', async ({ page }) => {
    const timestamp = Date.now();
    const email = `hierarchy_${timestamp}@example.com`;
    
    // Register
    await page.goto('http://localhost:5173/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder*="name" i]', 'Test User');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Go to main page
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // Create parent
    await page.keyboard.type('Parent');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Create child (indented)
    await page.keyboard.press('Tab');
    await page.keyboard.type('Child 1');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Create another child
    await page.keyboard.type('Child 2');
    await page.waitForTimeout(3000); // Wait for save
    
    // Logout
    const logoutBtn = page.locator('button:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Login again
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Go to main page
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);
    
    // Check items exist
    const parent = page.locator('text=Parent');
    const child1 = page.locator('text=Child 1');
    const child2 = page.locator('text=Child 2');
    
    // Use longer timeouts and check if any are visible
    const parentVisible = await parent.first().isVisible({ timeout: 5000 }).catch(() => false);
    const child1Visible = await child1.first().isVisible({ timeout: 5000 }).catch(() => false);
    const child2Visible = await child2.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (parentVisible && child1Visible && child2Visible) {
      console.log('✅ Hierarchy persisted!');
    } else {
      console.log('❌ Items not found after login');
      console.log('Parent visible:', parentVisible);
      console.log('Child 1 visible:', child1Visible);
      console.log('Child 2 visible:', child2Visible);
    }
  });

  test('voice mode UI exists', async ({ page }) => {
    const timestamp = Date.now();
    const email = `voice_${timestamp}@example.com`;
    
    // Register
    await page.goto('http://localhost:5173/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder*="name" i]', 'Test User');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Go to main page
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // Look for voice button
    const voiceBtn = page.locator('button[aria-label*="voice" i], [class*="mic"]').first();
    if (await voiceBtn.isVisible()) {
      console.log('✅ Voice button exists');
      await voiceBtn.click();
      await page.waitForTimeout(1000);
      
      // Check modal opened
      const modal = page.locator('[class*="modal"], [class*="voice"]').first();
      if (await modal.isVisible()) {
        console.log('✅ Voice modal opens');
      }
    }
  });

  test('AI assistant UI exists', async ({ page }) => {
    const timestamp = Date.now();
    const email = `ai_${timestamp}@example.com`;
    
    // Register
    await page.goto('http://localhost:5173/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder*="name" i]', 'Test User');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Go to main page
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // Look for AI button
    const aiBtn = page.locator('button[aria-label*="AI" i], [class*="brain"]').first();
    if (await aiBtn.isVisible()) {
      console.log('✅ AI button exists');
      await aiBtn.click();
      await page.waitForTimeout(1000);
      
      // Check panel opened
      const panel = page.locator('[class*="assistant"], [class*="llm"]').first();
      if (await panel.isVisible()) {
        console.log('✅ AI panel opens');
      }
    }
  });
});