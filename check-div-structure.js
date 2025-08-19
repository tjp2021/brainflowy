const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Add item
  const addButton = page.locator('.flex-1').locator('button:has-text("Add new item")').first();
  await addButton.click();
  await page.waitForTimeout(500);
  
  // Type and press Enter
  const textarea = page.locator('textarea').first();
  await textarea.fill('First bullet point');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  
  // Get the actual HTML structure
  const outlineContent = await page.locator('.outline-desktop-content').innerHTML();
  console.log('Outline content HTML:');
  console.log(outlineContent.substring(0, 1000));
  
  await browser.close();
})();
