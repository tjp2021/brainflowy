const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('PAGE:', msg.text());
  });
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Click Header button');
  const headerButton = page.locator('button:has-text("Header")');
  await headerButton.click();
  
  console.log('2. Click Add new item');
  const addButton = page.locator('button:has-text("Add new item")');
  await addButton.click();
  
  console.log('3. Type header text');
  let textarea = page.locator('textarea');
  await textarea.fill('This is a header');
  
  console.log('4. Press Enter to save and create new item');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  console.log('5. Check if new textarea is visible');
  const textareaCount = await page.locator('textarea').count();
  console.log('   Textarea count:', textareaCount);
  
  if (textareaCount > 0) {
    console.log('   Textarea IS visible after Enter');
    
    console.log('6. Click Code button');
    const codeButton = page.locator('button:has-text("Code")');
    await codeButton.click();
    await page.waitForTimeout(500);
    
    console.log('7. Check if textarea still visible after Code click');
    const textareaCountAfterCode = await page.locator('textarea').count();
    console.log('   Textarea count after Code click:', textareaCountAfterCode);
    
    if (textareaCountAfterCode > 0) {
      console.log('8. Fill code text');
      textarea = page.locator('textarea');
      await textarea.fill('function example() { return true; }');
      
      console.log('9. Press Enter to save');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Check the style
      const codeItem = await page.locator('.px-2.py-1').filter({ hasText: 'function example()' }).first();
      const classes = await codeItem.getAttribute('class');
      console.log('10. Code item classes:', classes);
      console.log('    Has font-mono?', classes.includes('font-mono'));
    }
  } else {
    console.log('   ERROR: No textarea after Enter!');
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();