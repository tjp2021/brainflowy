const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  // Add console listener
  page.on('console', msg => {
    if (msg.text().includes('Creating') || msg.text().includes('item')) {
      console.log('CONSOLE:', msg.text());
    }
  });
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Clicking Add new item...');
  const addButton = page.locator('.flex-1').locator('button:has-text("Add new item")').first();
  await addButton.click();
  
  await page.waitForTimeout(500);
  
  console.log('2. Getting textarea and typing...');
  const textarea = page.locator('textarea').first();
  await textarea.fill('First bullet point');
  
  console.log('3. About to press Enter...');
  await page.keyboard.press('Enter');
  
  console.log('4. Waiting a bit...');
  await page.waitForTimeout(2000);
  
  console.log('5. Checking state after Enter:');
  
  // Check for the div with our text
  const divCount = await page.locator('div:has-text("First bullet point")').count();
  console.log('   Divs with "First bullet point":', divCount);
  
  // Check textareas
  const textareas = await page.locator('textarea').all();
  console.log('   Number of textareas:', textareas.length);
  
  for (let i = 0; i < textareas.length; i++) {
    const value = await textareas[i].inputValue();
    console.log(`   Textarea ${i} value:`, value);
  }
  
  // Check all item text
  const items = await page.locator('[class*="outline"]').locator('div').all();
  console.log('   Checking first 10 divs:');
  for (let i = 0; i < Math.min(10, items.length); i++) {
    const text = await items[i].textContent();
    if (text && text.trim() && !text.includes('BrainFlowy')) {
      console.log(`   Div ${i}: "${text.substring(0, 30)}"`);
    }
  }
  
  await page.screenshot({ path: 'enter-detailed.png' });
  console.log('Screenshot saved to enter-detailed.png');
  
  await browser.close();
})();
