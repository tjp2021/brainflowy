import { test, expect } from '@playwright/test';

test.describe('LLM Integration End-to-End', () => {
  let accessToken: string;
  let outlineId: string;

  test('Complete user flow: Register → Create Outline → Use AI → See Results', async ({ page }) => {
    // 1. Go to app
    await page.goto('http://localhost:5173');
    
    // 2. Register new user
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    await page.click('text=Sign up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');
    await page.click('button:has-text("Sign up")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    // 3. Should see outline interface
    await expect(page.locator('text=Work Notes')).toBeVisible();
    
    // 4. Click on an outline item or create one
    const hasItems = await page.locator('.outline-item').count() > 0;
    if (!hasItems) {
      // Add an item first
      await page.click('button:has-text("Add Item")');
      await page.fill('.outline-item input', 'Test item for AI');
      await page.press('.outline-item input', 'Enter');
    }
    
    // 5. Click the AI sparkles button on an item
    await page.hover('.outline-item').first();
    await page.click('.outline-item button[title="Edit with AI"]').first();
    
    // 6. Verify LLM panel opens
    await expect(page.locator('.llm-assistant-panel')).toBeVisible();
    
    // 7. Type a prompt and submit
    const promptText = 'Create an SPOV about improving team productivity';
    await page.fill('.llm-assistant-panel textarea', promptText);
    await page.click('.llm-assistant-panel button[type="submit"]');
    
    // 8. Wait for AI response (checking for loading state first)
    await expect(page.locator('.llm-assistant-panel .processing-indicator')).toBeVisible();
    
    // 9. Wait for response to appear (max 30 seconds for real API)
    await expect(page.locator('.assistant-message')).toBeVisible({ timeout: 30000 });
    
    // 10. Verify response contains expected SPOV structure
    const responseText = await page.locator('.assistant-message').textContent();
    expect(responseText).toContain('Description:');
    expect(responseText).toContain('Evidence:');
    expect(responseText).toContain('Implementation Levers:');
    
    // 11. Click Apply to add to outline
    await page.click('button:has-text("Apply")');
    
    // 12. Verify content was added to outline
    await expect(page.locator('.outline-item:has-text("Description:")')).toBeVisible();
    await expect(page.locator('.outline-item:has-text("Evidence:")')).toBeVisible();
    
    console.log('✅ Full end-to-end LLM integration test passed!');
  });

  test('Error handling: API failure fallback', async ({ page }) => {
    // Login with existing user
    await page.goto('http://localhost:5173');
    await page.click('text=Sign in');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    
    // Stop the backend to simulate failure
    await page.evaluate(() => {
      // Intercept the next fetch to simulate API failure
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        if (args[0].includes('llm-action')) {
          return Promise.reject(new Error('Network error'));
        }
        return originalFetch.apply(this, args);
      };
    });
    
    // Try to use AI
    await page.hover('.outline-item').first();
    await page.click('.outline-item button[title="Edit with AI"]').first();
    await page.fill('.llm-assistant-panel textarea', 'Test prompt');
    await page.click('.llm-assistant-panel button[type="submit"]');
    
    // Should show offline mode message
    await expect(page.locator('text=Using offline mode')).toBeVisible({ timeout: 10000 });
    
    // Should still get a response (mock)
    await expect(page.locator('.assistant-message')).toBeVisible();
  });
});