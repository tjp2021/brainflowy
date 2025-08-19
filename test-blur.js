const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('onBlur')) {
      console.log('CONSOLE:', msg.text());
    }
  });
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Add item
  const addButton = page.locator('.flex-1').locator('button:has-text("Add new item")').first();
  await addButton.click();
  await page.waitForTimeout(500);
  
  // Type text
  const textarea = page.locator('textarea').first();
  await textarea.fill('TEST BLUR');
  
  // Click elsewhere to trigger blur
  console.log('Clicking elsewhere to trigger blur...');
  await page.click('h1'); // Click on the header
  await page.waitForTimeout(1000);
  
  // Check if saved
  const divWithText = await page.locator('div:has-text("TEST BLUR")').count();
  console.log('Divs with "TEST BLUR":', divWithText);
  
  await browser.close();
})();
