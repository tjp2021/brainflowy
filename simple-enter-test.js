const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Add item
  console.log('1. Adding new item...');
  const addButton = page.locator('.flex-1').locator('button:has-text("Add new item")').first();
  await addButton.click();
  await page.waitForTimeout(500);
  
  // Type text
  console.log('2. Typing text...');
  const textarea = page.locator('textarea').first();
  await textarea.fill('TEST ITEM');
  
  // Press Escape to save without creating new item
  console.log('3. Pressing Escape to save...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  
  // Check if saved
  console.log('4. Checking if saved...');
  const divWithText = await page.locator('div:has-text("TEST ITEM")').count();
  console.log('   Divs with "TEST ITEM":', divWithText);
  
  // Check all text on page
  const bodyText = await page.locator('body').innerText();
  console.log('   Page includes "TEST ITEM":', bodyText.includes('TEST ITEM'));
  
  await browser.close();
})();
