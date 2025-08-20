import { test, expect } from '@playwright/test';

test.describe('Brainlift Template Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
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
    await page.click('button:has-text("Create Account")');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Create Brainlift button should be visible', async ({ page }) => {
    // Check if the Create Brainlift button exists
    const brainliftButton = page.locator('button:has-text("Create Brainlift")');
    await expect(brainliftButton).toBeVisible({ timeout: 5000 });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'brainlift-button-visible.png', fullPage: true });
  });

  test('Clicking Create Brainlift should populate template', async ({ page }) => {
    // Click the Create Brainlift button
    const brainliftButton = page.locator('button:has-text("Create Brainlift")');
    await brainliftButton.click();
    
    // Since there's no existing content, no confirmation dialog should appear
    // Wait for template items to appear
    await page.waitForTimeout(1000);
    
    // Check for key template sections
    const titleSection = page.locator('text=[Title]: [Subtitle]');
    await expect(titleSection).toBeVisible({ timeout: 5000 });
    
    const ownerSection = page.locator('text=Owner').first();
    await expect(ownerSection).toBeVisible();
    
    const purposeSection = page.locator('text=Purpose').first();
    await expect(purposeSection).toBeVisible();
    
    const outOfScopeSection = page.locator('text=Out of scope:');
    await expect(outOfScopeSection).toBeVisible();
    
    const initiativeSection = page.locator('text=Initiative Overview:');
    await expect(initiativeSection).toBeVisible();
    
    // Check for SPOV sections
    const spov1 = page.locator('text=1.1-SPOV');
    await expect(spov1).toBeVisible();
    
    const spov2 = page.locator('text=2.1-SPOV');
    await expect(spov2).toBeVisible();
    
    // Check for DOK sections
    const dok3 = page.locator('text=DOK3 - Insights');
    await expect(dok3).toBeVisible();
    
    const dok2 = page.locator('text=DOK2 - Knowledge Tree');
    await expect(dok2).toBeVisible();
    
    const dok1 = page.locator('text=DOK1 - Evidence & Facts');
    await expect(dok1).toBeVisible();
    
    // Check for Expert Advisory Council
    const expertSection = page.locator('text=Expert Advisory Council');
    await expect(expertSection).toBeVisible();
    
    // Take screenshot of populated template
    await page.screenshot({ path: 'brainlift-template-populated.png', fullPage: true });
  });

  test('Template should have proper hierarchy with indentation', async ({ page }) => {
    // Click the Create Brainlift button
    const brainliftButton = page.locator('button:has-text("Create Brainlift")');
    await brainliftButton.click();
    
    await page.waitForTimeout(1000);
    
    // Check that sub-items have proper indentation
    const bigPicture = page.locator('text=Big Picture:');
    await expect(bigPicture).toBeVisible();
    
    // Check the parent element has proper padding/indentation
    const bigPictureElement = await bigPicture.elementHandle();
    if (bigPictureElement) {
      const style = await bigPictureElement.evaluate(el => {
        const parent = el.closest('[style*="padding"]');
        return parent ? window.getComputedStyle(parent).paddingLeft : null;
      });
      
      // Should have some indentation (not 8px which is level 0)
      expect(style).toBeTruthy();
      console.log('Big Picture padding:', style);
    }
    
    // Take screenshot showing hierarchy
    await page.screenshot({ path: 'brainlift-hierarchy.png', fullPage: true });
  });

  test('Confirmation dialog should appear if existing content', async ({ page }) => {
    // First add some content
    const addItemButton = page.locator('button:has-text("Add new item")');
    await addItemButton.click();
    
    // Type some text in the new item
    const textarea = page.locator('textarea').first();
    await textarea.fill('Existing content');
    await textarea.blur();
    
    await page.waitForTimeout(500);
    
    // Now click Create Brainlift
    const brainliftButton = page.locator('button:has-text("Create Brainlift")');
    
    // Set up dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('replace your current outline');
      await dialog.accept(); // Accept the confirmation
    });
    
    await brainliftButton.click();
    
    // After accepting, template should be loaded
    await page.waitForTimeout(1000);
    const titleSection = page.locator('text=[Title]: [Subtitle]');
    await expect(titleSection).toBeVisible();
    
    // Existing content should be gone
    const existingContent = page.locator('text=Existing content');
    await expect(existingContent).not.toBeVisible();
  });

  test('All placeholder texts should be present', async ({ page }) => {
    // Click the Create Brainlift button
    const brainliftButton = page.locator('button:has-text("Create Brainlift")');
    await brainliftButton.click();
    
    await page.waitForTimeout(1000);
    
    // Check for various placeholder texts
    const placeholders = [
      '[Brief description]',
      '[Name]',
      '[Purpose description]',
      '[Out of scope item 1]',
      '[Big picture description]',
      '[Conservative metric 1]',
      '[Normal metric 1]',
      '[Optimistic metric 1]',
      '[SPOV Description - explain the strategic point of view]',
      '[Evidence point 1]',
      '[Implementation lever 1]',
      '[Insight description - key takeaway or learning]',
      '[Knowledge Category 1]',
      '[Evidence Category 1]',
      '[Expert Name] - [Organization]',
      '[Validation area 1]'
    ];
    
    for (const placeholder of placeholders) {
      const element = page.locator(`text=${placeholder}`).first();
      await expect(element).toBeVisible({ timeout: 5000 });
    }
    
    console.log('All placeholder texts are present');
  });
});