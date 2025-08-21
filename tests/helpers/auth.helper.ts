import { Page } from '@playwright/test';

export async function registerNewUser(page: Page, prefix: string = 'test') {
  const timestamp = Date.now();
  const testEmail = `${prefix}_${timestamp}@example.com`;
  const testPassword = 'TestPass123!';
  
  // Navigate to register page
  await page.goto('http://localhost:5174/register');
  await page.waitForLoadState('networkidle');
  
  // Fill registration form
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.fill('input[name="displayName"], input[placeholder*="name" i]', `${prefix} Test User`);
  
  // Submit registration
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5174/');
  
  // Wait for page to stabilize
  await page.waitForTimeout(1000);
  
  return { email: testEmail, password: testPassword };
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5174/');
  await page.waitForTimeout(1000);
}

export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
  await logoutButton.click();
  await page.waitForURL(/.*login/);
}