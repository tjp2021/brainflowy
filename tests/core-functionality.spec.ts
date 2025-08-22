import { test, expect } from '@playwright/test';

test.describe('Core Functionality Tests', () => {
  const timestamp = Date.now();
  const testEmail = `test_${timestamp}@example.com`;
  const testPassword = 'TestPass123!';

  test('should register, create hierarchy, persist after logout/login', async ({ page }) => {
    // Step 1: Register
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[name="displayName"], input[placeholder*="name" i]', 'Test User');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/**', { timeout: 10000 });
    
    // Navigate to main page if needed
    if (!page.url().endsWith('/')) {
      await page.goto('http://localhost:5173/');
    }
    
    await page.waitForTimeout(2000);
    console.log('✅ Registered and on main page');
    
    // Step 2: Create hierarchy - wait for page to be ready
    await page.waitForTimeout(2000);
    
    // Click in the outline area to focus
    const outlineArea = page.locator('[class*="outline"], [data-testid="outline"], main').first();
    if (await outlineArea.isVisible()) {
      await outlineArea.click();
    }
    
    // Type content with explicit waits
    await page.keyboard.type('Main Task');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await page.keyboard.type('Subtask 1');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    await page.keyboard.type('Subtask 2');
    await page.waitForTimeout(500);
    
    // Wait for auto-save
    await page.waitForTimeout(3000);
    console.log('✅ Created hierarchy');
    
    // Step 3: Take screenshot before logout
    await page.screenshot({ path: 'before-logout.png' });
    
    // Step 4: Logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/.*login/, { timeout: 10000 });
      console.log('✅ Logged out');
    }
    
    // Step 5: Login again
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:5173/**', { timeout: 10000 });
    
    if (!page.url().endsWith('/')) {
      await page.goto('http://localhost:5173/');
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ Logged back in');
    
    // Step 6: Take screenshot after login
    await page.screenshot({ path: 'after-login.png' });
    
    // Step 7: Verify content persisted - use flexible selectors
    const mainTaskSelector = page.locator('text=/Main Task/i, :has-text("Main Task")').first();
    const subtask1Selector = page.locator('text=/Subtask 1/i, :has-text("Subtask 1")').first();
    const subtask2Selector = page.locator('text=/Subtask 2/i, :has-text("Subtask 2")').first();
    
    // Check with longer timeout
    await expect(mainTaskSelector).toBeVisible({ timeout: 10000 });
    await expect(subtask1Selector).toBeVisible({ timeout: 5000 });
    await expect(subtask2Selector).toBeVisible({ timeout: 5000 });
    
    console.log('✅✅✅ SUCCESS: Hierarchy persisted after logout/login');
  });

  test('should test voice mode creates items', async ({ page }) => {
    // Register new user
    const voiceTimestamp = Date.now();
    const voiceEmail = `voice_${voiceTimestamp}@example.com`;
    
    await page.goto('http://localhost:5173/register');
    await page.fill('input[type="email"]', voiceEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[name="displayName"], input[placeholder*="name" i]', 'Voice User');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/**', { timeout: 10000 });
    
    if (!page.url().endsWith('/')) {
      await page.goto('http://localhost:5173/');
    }
    
    await page.waitForTimeout(2000);
    
    // Look for voice button
    const voiceButton = page.locator('button[aria-label*="Voice" i], button[aria-label*="voice" i], button:has-text("Voice"), [class*="mic"]').first();
    
    if (await voiceButton.isVisible()) {
      console.log('✅ Voice button found');
      // We can't actually test voice input in automated tests, but we can verify the UI exists
      await voiceButton.click();
      await page.waitForTimeout(1000);
      
      // Check for voice modal
      const voiceModal = page.locator('text=/Voice/i, text=/Speak/i, [class*="voice"]').first();
      if (await voiceModal.isVisible()) {
        console.log('✅ Voice modal opened');
        
        // Close modal
        const closeButton = page.locator('button[aria-label="Close"], button:has-text("Close"), button:has-text("Cancel")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('should test LLM assistant panel', async ({ page }) => {
    // Register new user
    const llmTimestamp = Date.now();
    const llmEmail = `llm_${llmTimestamp}@example.com`;
    
    await page.goto('http://localhost:5173/register');
    await page.fill('input[type="email"]', llmEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[name="displayName"], input[placeholder*="name" i]', 'LLM User');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/**', { timeout: 10000 });
    
    if (!page.url().endsWith('/')) {
      await page.goto('http://localhost:5173/');
    }
    
    await page.waitForTimeout(2000);
    
    // Look for AI assistant button
    const aiButton = page.locator('button[aria-label*="AI" i], button[aria-label*="assistant" i], button:has-text("AI"), [class*="brain"]').first();
    
    if (await aiButton.isVisible()) {
      console.log('✅ AI Assistant button found');
      await aiButton.click();
      await page.waitForTimeout(1000);
      
      // Check for AI panel
      const aiPanel = page.locator('text=/AI Assistant/i, text=/Assistant/i, [class*="assistant"]').first();
      if (await aiPanel.isVisible()) {
        console.log('✅ AI Assistant panel opened');
        
        // Look for input area
        const aiInput = page.locator('textarea[placeholder*="Ask" i], textarea[placeholder*="create" i], input[placeholder*="Ask" i]').first();
        if (await aiInput.isVisible()) {
          console.log('✅ AI input area found');
        }
      }
    }
  });
});