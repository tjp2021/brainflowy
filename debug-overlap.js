const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Find all "Add new item" buttons
  const buttons = await page.locator('button:has-text("Add new item")').all();
  console.log(`Found ${buttons.length} "Add new item" buttons`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const box = await button.boundingBox();
    const text = await button.textContent();
    console.log(`Button ${i}: "${text}" at`, box);
    
    // Check what's at this position
    if (box) {
      const elementAtPoint = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x + 10, y + 10);
        return {
          tag: el?.tagName,
          class: el?.className,
          text: el?.textContent?.substring(0, 50)
        };
      }, box);
      console.log('  Element at button position:', elementAtPoint);
    }
  }
  
  await page.screenshot({ path: 'overlap-debug.png' });
  await browser.close();
})();
