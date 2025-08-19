import { test, expect } from '@playwright/test';

test('02: Find input elements on page', async ({ page }) => {
  console.log('TEST 02: Finding input elements');
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Count different types of inputs
  const textareas = await page.locator('textarea').count();
  const inputs = await page.locator('input[type="text"]').count();
  const contentEditable = await page.locator('[contenteditable="true"]').count();
  
  console.log('Textareas found:', textareas);
  console.log('Text inputs found:', inputs);
  console.log('ContentEditable elements found:', contentEditable);
  
  // Look for existing outline items
  const outlineItems = await page.locator('.outline-item, [class*="item"], [class*="outline"]').count();
  console.log('Outline-related elements found:', outlineItems);
  
  // Check if there are any visible text that looks like outline content
  const hasMarketingText = await page.getByText('Marketing Campaign').count() > 0;
  const hasSocialMedia = await page.getByText('Social Media Strategy').count() > 0;
  
  console.log('Has "Marketing Campaign" text:', hasMarketingText);
  console.log('Has "Social Media Strategy" text:', hasSocialMedia);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/02-elements-found.png' });
  
  // At least some interactive elements should exist
  const totalInteractive = textareas + inputs + contentEditable;
  console.log('Total interactive elements:', totalInteractive);
  
  if (totalInteractive === 0) {
    console.log('WARNING: No input elements found - may need to click something first');
  }
});