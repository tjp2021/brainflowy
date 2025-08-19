const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('[vite]') && !text.includes('React') && !text.includes('DevTools')) {
      console.log('PAGE:', text);
    }
  });
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Add item
  console.log('\n=== ADDING NEW ITEM ===');
  const addButton = page.locator('.flex-1').locator('button:has-text("Add new item")').first();
  await addButton.click();
  await page.waitForTimeout(500);
  
  // Type text
  console.log('\n=== TYPING TEXT ===');
  const textarea = page.locator('textarea').first();
  await textarea.fill('First bullet point');
  
  // Press Enter
  console.log('\n=== PRESSING ENTER ===');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  
  // Check results
  console.log('\n=== CHECKING RESULTS ===');
  const items = await page.locator('.outline-desktop-content .group').all();
  for (let i = 0; i < items.length; i++) {
    const text = await items[i].innerText();
    if (text.trim()) {
      console.log(`Item ${i}: "${text.trim()}"`);
    } else {
      console.log(`Item ${i}: [empty]`);
    }
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();