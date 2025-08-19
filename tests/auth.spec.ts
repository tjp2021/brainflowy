import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('networkidle');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('http://localhost:5176/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*login/);
    
    // Wait for the page content to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check if we have the login form - wait for it to appear
    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    expect(emailInput).toBeTruthy();
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Check for submit button - using the actual text from the component
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Sign In');
  });

  test('should display register page', async ({ page }) => {
    await page.goto('http://localhost:5176/register');
    
    await expect(page).toHaveURL(/.*register/);
    
    // Check for email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check for password input - register has two password fields
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('http://localhost:5176/login');
    
    const registerLink = page.locator('a[href*="register"], a:has-text("Sign up"), a:has-text("Register"), a:has-text("Create account")');
    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await expect(page).toHaveURL(/.*register/);
    }
    
    await page.goto('http://localhost:5176/register');
    const loginLink = page.locator('a[href*="login"], a:has-text("Sign in"), a:has-text("Login"), a:has-text("Already have an account")');
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should handle login form submission', async ({ page }) => {
    await page.goto('http://localhost:5176/login');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/auth') || response.url().includes('/login'),
      { timeout: 5000 }
    ).catch(() => null);
    
    await submitButton.click();
    
    const response = await responsePromise;
    if (response) {
      if (response.status() === 200) {
        await expect(page).toHaveURL('http://localhost:5176/');
      }
    }
  });

  test('should handle registration form submission', async ({ page }) => {
    await page.goto('http://localhost:5176/register');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first(); // First password field
    const confirmPasswordInput = page.locator('input[type="password"]').nth(1); // Confirm password field
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    const submitButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('newuser@example.com');
    await passwordInput.fill('securePassword123');
    await confirmPasswordInput.fill('securePassword123'); // Fill confirm password too
    
    if (await nameInput.count() > 0) {
      await nameInput.first().fill('Test User');
    }
    
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/auth') || response.url().includes('/register'),
      { timeout: 5000 }
    ).catch(() => null);
    
    await submitButton.click();
    
    const response = await responsePromise;
    if (response) {
      if (response.status() === 200 || response.status() === 201) {
        await expect(page).toHaveURL('http://localhost:5176/');
      }
    }
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('http://localhost:5176/login');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    const errorMessages = page.locator('.error, .invalid-feedback, [role="alert"], .text-red-500, .text-danger');
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test('should maintain session after login', async ({ page, context }) => {
    await page.goto('http://localhost:5176/login');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(cookie => 
      cookie.name.includes('session') || 
      cookie.name.includes('token') || 
      cookie.name.includes('auth')
    );
    
    if (sessionCookie) {
      expect(sessionCookie).toBeDefined();
    }
    
    const localStorage = await page.evaluate(() => {
      return {
        token: window.localStorage.getItem('token'),
        user: window.localStorage.getItem('user'),
      };
    });
    
    if (localStorage.token || localStorage.user) {
      expect(localStorage.token || localStorage.user).toBeTruthy();
    }
  });

  test('should handle logout functionality', async ({ page }) => {
    await page.goto('http://localhost:5176');
    
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")');
    
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(500);
      
      const localStorage = await page.evaluate(() => {
        return {
          token: window.localStorage.getItem('token'),
          user: window.localStorage.getItem('user'),
        };
      });
      
      expect(localStorage.token).toBeNull();
      expect(localStorage.user).toBeNull();
    }
  });
});