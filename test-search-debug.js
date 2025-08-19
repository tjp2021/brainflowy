const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  
  console.log('1. Registering and logging in...');
  await page.goto('http://localhost:5176');
  await page.click('text=Sign up');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'Test123!');
  await page.fill('input[name="confirmPassword"]', 'Test123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/outlines/, { timeout: 10000 });
  
  console.log('2. Waiting for page to load...');
  await page.waitForTimeout(3000);
  
  console.log('3. Looking for Add new item button...');
  const addButtons = await page.locator('button:has-text("Add new item")').count();
  console.log('   Found', addButtons, 'Add new item button(s)');
  
  if (addButtons > 0) {
    console.log('4. Clicking first Add new item button...');
    await page.locator('button:has-text("Add new item")').first().click();
    await page.waitForTimeout(1000);
    
    console.log('5. Looking for textarea...');
    const textareas = await page.locator('textarea').count();
    console.log('   Found', textareas, 'textarea(s)');
    
    if (textareas > 0) {
      console.log('6. Found textarea! Testing...');
      await page.locator('textarea').first().fill('Test Item');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      console.log('7. Item should be saved. Looking for it...');
      const itemVisible = await page.locator('text=Test Item').isVisible().catch(() => false);
      console.log('   Test Item visible:', itemVisible);
    }
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();