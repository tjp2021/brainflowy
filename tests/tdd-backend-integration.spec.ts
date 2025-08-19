import { test, expect } from '@playwright/test';

test.describe('TDD: Backend Integration & Authentication', () => {
  
  test('User can register a new account', async ({ page }) => {
    await page.goto('http://localhost:5176');
    
    // Click on "Sign up" or "Register" link
    await page.click('text=Sign up');
    
    // Fill registration form with unique email
    const uniqueEmail = `test${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for navigation after registration
    await page.waitForURL(/\/(dashboard|outlines|login)/, { timeout: 10000 });
    
    // If redirected to login, verify account was created
    if (page.url().includes('login')) {
      await page.fill('input[name="email"]', uniqueEmail);
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/outlines/, { timeout: 5000 });
    }
    
    // Should be authenticated and see outline page
    await expect(page.locator('text=My Outlines').first()).toBeVisible();
  });

  test('User can login with existing credentials', async ({ page }) => {
    // First create a user
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    // Register first
    await page.goto('http://localhost:5176');
    await page.click('text=Sign up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/outlines/, { timeout: 10000 });
    
    // Logout
    await page.click('text=Logout');
    await page.waitForURL(/\/(login|\/)/, { timeout: 10000 });
    
    // Now test login
    await page.goto('http://localhost:5176');
    
    // Fill login form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Should redirect to outlines
    await expect(page).toHaveURL(/\/outlines/);
    
    // Should see user's existing outlines
    await expect(page.locator('text=My Outlines')).toBeVisible();
    
    // Should not see 403 errors in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('403')) {
        consoleErrors.push(msg.text());
      }
    });
    
    // Perform an action that requires auth
    await page.click('button:has-text("Add new item")');
    await page.waitForTimeout(1000);
    
    // No 403 errors should have occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('Session persists across page refreshes', async ({ page }) => {
    // Create and login
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    await page.goto('http://localhost:5176');
    await page.click('text=Sign up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await expect(page).toHaveURL(/\/outlines/);
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('text=Logout')).toBeVisible();
    await expect(page.locator('text=My Outlines').first()).toBeVisible();
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
  });

  test('Outline items persist to database', async ({ page }) => {
    // Create and login
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    await page.goto('http://localhost:5176');
    await page.click('text=Sign up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/outlines/);
    
    // Create a new outline item
    const uniqueText = `Test Item ${Date.now()}`;
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    await textarea.fill(uniqueText);
    await page.keyboard.press('Enter');
    
    // Verify item is displayed
    await expect(page.locator(`text="${uniqueText}"`)).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Item should still be there after refresh
    await expect(page.locator(`text="${uniqueText}"`)).toBeVisible();
  });

  test('Multiple outlines can be created and switched', async ({ page }) => {
    // Create and login
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    await page.goto('http://localhost:5176');
    await page.click('text=Sign up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/outlines/);
    
    // Create first outline
    await page.click('button:has-text("New Outline")');
    await page.fill('input[placeholder="Outline name"]', 'Project Alpha');
    await page.keyboard.press('Enter');
    
    // Add item to first outline
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Alpha Task 1');
    await page.keyboard.press('Enter');
    
    // Create second outline
    await page.click('button:has-text("New Outline")');
    await page.fill('input[placeholder="Outline name"]', 'Project Beta');
    await page.keyboard.press('Enter');
    
    // Add item to second outline
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').fill('Beta Task 1');
    await page.keyboard.press('Enter');
    
    // Switch back to first outline
    await page.click('text=Project Alpha');
    
    // Should see Alpha items, not Beta items
    await expect(page.locator('text=Alpha Task 1')).toBeVisible();
    await expect(page.locator('text=Beta Task 1')).not.toBeVisible();
    
    // Switch to second outline
    await page.click('text=Project Beta');
    
    // Should see Beta items, not Alpha items
    await expect(page.locator('text=Beta Task 1')).toBeVisible();
    await expect(page.locator('text=Alpha Task 1')).not.toBeVisible();
  });

  test('Logout clears session and redirects to login', async ({ page }) => {
    // Create and login
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    await page.goto('http://localhost:5176');
    await page.click('text=Sign up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/outlines/);
    
    // Click logout
    await page.click('text=Logout');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/(login|\/)/);
    
    // Try to access protected route directly
    await page.goto('http://localhost:5176/outlines');
    
    // Should redirect back to login
    await expect(page).toHaveURL(/\/(login|\/)/);
  });

  test('Invalid credentials show error message', async ({ page }) => {
    // Create a user first
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    await page.goto('http://localhost:5176');
    await page.click('text=Sign up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/outlines/);
    
    // Logout
    await page.click('text=Logout');
    await page.waitForURL(/\/(login|\/)/);
    
    // Try to login with wrong password
    await page.goto('http://localhost:5176');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/Invalid|Wrong|Incorrect|Failed/')).toBeVisible();
    
    // Should not redirect to outlines
    expect(page.url()).not.toContain('/outlines');
  });

  test('Auto-save works for outline changes', async ({ page }) => {
    // Create and login
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    await page.goto('http://localhost:5176');
    await page.click('text=Sign up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/outlines/);
    
    // Create an item
    await page.click('button:has-text("Add new item")');
    const textarea = page.locator('textarea').first();
    await textarea.fill('Original text');
    await page.keyboard.press('Enter');
    
    // Edit the item
    await page.click('text=Original text');
    const editTextarea = page.locator('textarea').first();
    await editTextarea.fill('Updated text');
    
    // Wait for auto-save (should happen on blur or after delay)
    await page.click('body'); // Click elsewhere to trigger blur
    await page.waitForTimeout(2000); // Wait for auto-save
    
    // Refresh page
    await page.reload();
    
    // Should see updated text
    await expect(page.locator('text=Updated text')).toBeVisible();
    await expect(page.locator('text=Original text')).not.toBeVisible();
  });
});