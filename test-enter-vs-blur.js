const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('onBlur') || text.includes('handleKeyDown')) {
      console.log('CONSOLE:', text);
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
  await textarea.fill('ENTER TEST');
  
  // Press Enter
  console.log('Pressing Enter...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  // Check if saved
  const divWithText = await page.locator('div:has-text("ENTER TEST")').count();
  console.log('Divs with "ENTER TEST":', divWithText);
  
  await browser.close();
})();
