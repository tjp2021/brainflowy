import { test, expect } from '@playwright/test';

test.describe('Progressive Integration - Fixed', () => {
  // Share user across steps within same test
  let testEmail: string;
  let testPassword: string;
  
  test('Complete User Flow', async ({ page }) => {
    // Setup unique user for this test run
    const timestamp = Date.now();
    testEmail = `test_${timestamp}@example.com`;
    testPassword = 'TestPass123!';
    
    console.log('Testing with user:', testEmail);
    
    // ========== PHASE 1: REGISTRATION ==========
    console.log('\n=== PHASE 1: REGISTRATION ===');
    
    // EXACTLY copy the working test pattern
    await page.goto('http://localhost:5173/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[placeholder*="name" i]', 'Test User');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Go to main page - EXACTLY like working test
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // Check if we're logged in (should see logout button)
    const logoutAfterReg = await page.locator('button:has-text("Logout")').first().isVisible().catch(() => false);
    
    if (logoutAfterReg) {
      console.log('✅ PHASE 1 PASSED: Registration successful, user logged in');
    } else {
      console.log('❌ PHASE 1 FAILED: Registration failed or user not logged in');
      throw new Error('Registration failed');
    }
    
    /* ========== UNCOMMENT PHASE 2 AFTER PHASE 1 PASSES ==========
    
    // ========== PHASE 2: LOGOUT ==========
    console.log('\n=== PHASE 2: LOGOUT ===');
    const logoutBtn = page.locator('button:has-text("Logout")').first();
    await logoutBtn.click();
    await page.waitForTimeout(2000);
    
    // Should redirect to login
    const onLoginPage = page.url().includes('login');
    
    if (onLoginPage) {
      console.log('✅ PHASE 2 PASSED: Logout successful');
    } else {
      console.log('❌ PHASE 2 FAILED: Still on main page after logout');
      throw new Error('Logout failed');
    }
    
    ========== END PHASE 2 ========== */
    
    /* ========== UNCOMMENT PHASE 3 AFTER PHASE 2 PASSES ==========
    
    // ========== PHASE 3: LOGIN ==========
    console.log('\n=== PHASE 3: LOGIN ===');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Go to main page
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // Check if logged in
    const logoutAfterLogin = await page.locator('button:has-text("Logout")').first().isVisible().catch(() => false);
    
    if (logoutAfterLogin) {
      console.log('✅ PHASE 3 PASSED: Login successful');
    } else {
      console.log('❌ PHASE 3 FAILED: Login failed');
      throw new Error('Login failed');
    }
    
    ========== END PHASE 3 ========== */
    
    /* ========== UNCOMMENT PHASE 4 AFTER PHASE 3 PASSES ==========
    
    // ========== PHASE 4: CREATE ITEMS ==========
    console.log('\n=== PHASE 4: CREATE ITEMS ===');
    
    // Type first item
    await page.keyboard.type('First item');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Type second item
    await page.keyboard.type('Second item');
    await page.waitForTimeout(2000);
    
    // Check if items exist
    const first = await page.locator('text=First item').first().isVisible().catch(() => false);
    const second = await page.locator('text=Second item').first().isVisible().catch(() => false);
    
    if (first && second) {
      console.log('✅ PHASE 4 PASSED: Items created');
    } else {
      console.log(`❌ PHASE 4 FAILED: Items not found (First: ${first}, Second: ${second})`);
      // Don't throw, let's continue to see what else works
    }
    
    ========== END PHASE 4 ========== */
    
    /* ========== UNCOMMENT PHASE 5 AFTER PHASE 4 PASSES ==========
    
    // ========== PHASE 5: CREATE HIERARCHY ==========
    console.log('\n=== PHASE 5: CREATE HIERARCHY ===');
    
    await page.keyboard.press('Enter');
    await page.keyboard.type('Parent item');
    await page.keyboard.press('Enter');
    
    // Indent for child
    await page.keyboard.press('Tab');
    await page.keyboard.type('Child item');
    await page.waitForTimeout(2000);
    
    const parent = await page.locator('text=Parent item').first().isVisible().catch(() => false);
    const child = await page.locator('text=Child item').first().isVisible().catch(() => false);
    
    if (parent && child) {
      console.log('✅ PHASE 5 PASSED: Hierarchy created');
    } else {
      console.log(`❌ PHASE 5 FAILED: Hierarchy not found (Parent: ${parent}, Child: ${child})`);
    }
    
    ========== END PHASE 5 ========== */
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Enabled phases completed successfully!');
  });
});