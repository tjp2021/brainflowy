import { Page } from '@playwright/test';

export async function registerNewUser(page: Page, prefix: string = 'test') {
  const timestamp = Date.now();
  const testEmail = `${prefix}_${timestamp}@example.com`;
  const testPassword = 'TestPass123!';
  
  // Navigate to register page
  await page.goto('http://localhost:5173/register');
  await page.waitForLoadState('networkidle');
  
  // Fill registration form
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.fill('input[name="displayName"], input[placeholder*="name" i]', `${prefix} Test User`);
  
  // Submit registration
  await page.click('button[type="submit"]');
  
  // Wait for either the main page or a welcome screen
  await page.waitForURL('http://localhost:5173/**', { timeout: 10000 });
  
  // If we're still on register, check for any errors
  const currentUrl = page.url();
  if (currentUrl.includes('/register')) {
    // Check for error message
    const errorElement = page.locator('text=/error/i, [class*="error"]').first();
    if (await errorElement.isVisible({ timeout: 1000 })) {
      const errorText = await errorElement.textContent();
      throw new Error(`Registration failed: ${errorText}`);
    }
  }
  
  // Navigate to main page if needed
  if (!currentUrl.endsWith('/')) {
    await page.goto('http://localhost:5173/');
  }
  
  // Wait for page to stabilize
  await page.waitForTimeout(2000);
  
  return { email: testEmail, password: testPassword };
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL('http://localhost:5173/**', { timeout: 10000 });
  
  // Navigate to main page if needed
  const currentUrl = page.url();
  if (!currentUrl.endsWith('/')) {
    await page.goto('http://localhost:5173/');
  }
  
  await page.waitForTimeout(2000);
}

export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
  await logoutButton.click();
  await page.waitForURL(/.*login/);
}