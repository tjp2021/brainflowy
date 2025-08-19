const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Clicking Add new item...');
  const addButton = page.locator('.flex-1').locator('button:has-text("Add new item")').first();
  await addButton.click();
  
  console.log('2. Checking for textarea...');
  const textarea = page.locator('textarea');
  const textareaCount = await textarea.count();
  console.log('   Found textareas:', textareaCount);
  
  if (textareaCount > 0) {
    console.log('3. Typing text...');
    await textarea.fill('First bullet point');
    
    console.log('4. Pressing Enter...');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    console.log('5. Checking what happened...');
    const divWithText = await page.locator('div:has-text("First bullet point")').count();
    console.log('   Divs with "First bullet point":', divWithText);
    
    const newTextarea = await page.locator('textarea').count();
    console.log('   Textareas after Enter:', newTextarea);
    
    // Check all divs
    const allDivs = await page.locator('div').all();
    for (const div of allDivs.slice(0, 20)) {
      const text = await div.textContent();
      if (text && text.includes('First')) {
        console.log('   Found div with text:', text.substring(0, 50));
      }
    }
  }
  
  await page.screenshot({ path: 'enter-debug.png' });
  await browser.close();
})();
