const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('1. Going to outlines page...');
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  console.log('2. Page title:', await page.title());
  console.log('3. Current URL:', page.url());
  
  const bodyText = await page.locator('body').innerText();
  console.log('4. Page contains:', bodyText.substring(0, 200));
  
  console.log('5. Looking for textareas...');
  const textareas = await page.locator('textarea').count();
  console.log('   Found textareas:', textareas);
  
  console.log('6. Looking for any input fields...');
  const inputs = await page.locator('input').count();
  console.log('   Found inputs:', inputs);
  
  console.log('7. Looking for contenteditable elements...');
  const editables = await page.locator('[contenteditable="true"]').count();
  console.log('   Found contenteditable:', editables);
  
  await page.screenshot({ path: 'outline-page-debug.png' });
  console.log('Screenshot saved to outline-page-debug.png');
  
  await browser.close();
})();
