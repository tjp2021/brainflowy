const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Log console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('handleKeyDown') || text.includes('updateItemText') || text.includes('addNewItemAfter')) {
      console.log('KEY EVENT:', text);
    }
  });
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Add console logging to the page
  await page.evaluate(() => {
    const originalLog = console.log;
    window.console.log = function(...args) {
      originalLog.apply(console, args);
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('updateItemText') || args[0].includes('handleKeyDown') || args[0].includes('addNewItemAfter'))) {
        document.body.setAttribute('data-last-log', args.join(' '));
      }
    };
  });
  
  // Add item
  console.log('1. Clicking Add new item...');
  const addButton = page.locator('.flex-1').locator('button:has-text("Add new item")').first();
  await addButton.click();
  await page.waitForTimeout(500);
  
  // Check initial state
  const itemsBefore = await page.locator('.outline-desktop-content .group').count();
  console.log('   Items before typing:', itemsBefore);
  
  // Type text
  console.log('2. Typing text...');
  const textarea = page.locator('textarea').first();
  await textarea.fill('First bullet point');
  const textValue = await textarea.inputValue();
  console.log('   Textarea value after typing:', textValue);
  
  // Press Enter
  console.log('3. Pressing Enter...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  
  // Check what happened
  console.log('4. Checking results...');
  
  // Check items after
  const itemsAfter = await page.locator('.outline-desktop-content .group').count();
  console.log('   Items after Enter:', itemsAfter);
  
  // Check for the text in any element
  const pageText = await page.locator('body').innerText();
  console.log('   Page contains "First bullet point":', pageText.includes('First bullet point'));
  
  // Check all items
  const items = await page.locator('.outline-desktop-content .group').all();
  console.log('   Checking all items:');
  for (let i = 0; i < items.length; i++) {
    const text = await items[i].innerText();
    console.log(`     Item ${i}: ${text.substring(0, 50)}`);
  }
  
  // Check textarea
  const textareaCount = await page.locator('textarea').count();
  console.log('   Textareas on page:', textareaCount);
  if (textareaCount > 0) {
    const newTextarea = page.locator('textarea').first();
    const value = await newTextarea.inputValue();
    console.log('   New textarea value:', value);
  }
  
  await page.waitForTimeout(5000); // Keep browser open
  await browser.close();
})();