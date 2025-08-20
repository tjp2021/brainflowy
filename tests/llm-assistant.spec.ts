import { test, expect } from '@playwright/test';

// Use the test credentials from registration
const testCredentials = {
  email: 'testuser@example.com',
  password: 'Test1234!',
  name: 'Test User'
};

test.describe('LLM Assistant Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Go to register page
    await page.click('text=Sign up');
    
    // Register with unique email
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder*="name" i]', 'Test User');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for navigation to outlines page
    await page.waitForURL('**/outlines', { timeout: 10000 });
  });

  test('should open LLM Assistant panel when AI Assistant button is clicked', async ({ page }) => {
    // Click the AI Assistant button
    await page.click('button:has-text("AI Assistant")');
    
    // Verify the panel is visible
    await expect(page.locator('h2:has-text("AI Assistant")')).toBeVisible();
    await expect(page.locator('text="How can I help you build your Brainlift?"')).toBeVisible();
    
    // Check that the three action buttons are visible
    await expect(page.locator('button:has-text("Create")')).toBeVisible();
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("Research")')).toBeVisible();
  });

  test('should show starter suggestions when panel opens', async ({ page }) => {
    // Open the AI Assistant
    await page.click('button:has-text("AI Assistant")');
    
    // Check for starter suggestions
    await expect(page.locator('text="Create an SPOV"')).toBeVisible();
    await expect(page.locator('text="Define Purpose"')).toBeVisible();
    await expect(page.locator('text="Research"')).toBeVisible();
  });

  test('should send user prompt and receive mock response', async ({ page }) => {
    // Open the AI Assistant
    await page.click('button:has-text("AI Assistant")');
    
    // Type a prompt
    await page.fill('textarea[placeholder*="Ask me to create content"]', 'Create an SPOV about customer retention');
    
    // Click send button or press Enter
    await page.click('button[type="submit"]');
    
    // Wait for mock response
    await expect(page.locator('text="I\'ve created 1 new item(s) for your outline."')).toBeVisible({ timeout: 5000 });
    
    // Check that suggestions appear
    await expect(page.locator('text="Would you like to add specific metrics"')).toBeVisible();
  });

  test('should close panel when X button is clicked', async ({ page }) => {
    // Open the AI Assistant
    await page.click('button:has-text("AI Assistant")');
    
    // Verify panel is open
    await expect(page.locator('h2:has-text("AI Assistant")')).toBeVisible();
    
    // Click close button
    await page.click('button[aria-label="Close"]', { force: true });
    // If aria-label doesn't work, try:
    await page.click('.fixed.right-0 button:has(svg)').catch(() => {
      // Fallback to clicking the X icon
      return page.locator('svg.lucide-x').locator('..').click();
    });
    
    // Verify panel is closed
    await expect(page.locator('h2:has-text("AI Assistant")')).not.toBeVisible();
  });

  test('should switch between Create, Edit, and Research modes', async ({ page }) => {
    // Open the AI Assistant
    await page.click('button:has-text("AI Assistant")');
    
    // Default should be Create mode
    await expect(page.locator('button:has-text("Create").bg-blue-100')).toBeVisible();
    
    // Switch to Research mode
    await page.click('button:has-text("Research")');
    await expect(page.locator('button:has-text("Research").bg-blue-100')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="What would you like to research"]')).toBeVisible();
    
    // Switch back to Create mode
    await page.click('button:has-text("Create")');
    await expect(page.locator('button:has-text("Create").bg-blue-100')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Ask me to create content"]')).toBeVisible();
  });

  test('should populate prompt when suggestion is clicked', async ({ page }) => {
    // Open the AI Assistant
    await page.click('button:has-text("AI Assistant")');
    
    // Click a suggestion
    await page.click('button:has-text("Help me write a clear purpose statement")');
    
    // Check that the textarea is populated
    const textarea = page.locator('textarea');
    await expect(textarea).toHaveValue('Help me write a clear purpose statement');
  });
});