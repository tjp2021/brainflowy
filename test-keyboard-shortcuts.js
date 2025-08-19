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
  await page.waitForTimeout(2000);
  
  console.log('\n2. Testing Cmd+B for bold/header...');
  await page.click('button:has-text("Add new item")');
  await page.waitForSelector('textarea', { state: 'visible' });
  const textarea = page.locator('textarea').first();
  await textarea.fill('Test Bold Text');
  
  // Try Cmd+B (Mac) or Ctrl+B (Windows/Linux)
  const isMac = process.platform === 'darwin';
  await page.keyboard.press(isMac ? 'Meta+b' : 'Control+b');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // Check if style was applied
  const boldItem = page.locator('div:has-text("Test Bold Text")').first();
  const classes = await boldItem.getAttribute('class');
  console.log('   Bold item classes:', classes);
  
  console.log('\n3. Testing Cmd+I for italic/quote...');
  await page.locator('textarea').first().fill('Test Italic Text');
  await page.keyboard.press(isMac ? 'Meta+i' : 'Control+i');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  const italicItem = page.locator('div:has-text("Test Italic Text")').first();
  const italicClasses = await italicItem.getAttribute('class');
  console.log('   Italic item classes:', italicClasses);
  
  console.log('\n4. Testing Cmd+E for code...');
  await page.locator('textarea').first().fill('const code = true');
  await page.keyboard.press(isMac ? 'Meta+e' : 'Control+e');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  const codeItem = page.locator('div:has-text("const code = true")').first();
  const codeClasses = await codeItem.getAttribute('class');
  console.log('   Code item classes:', codeClasses);
  
  console.log('\n5. Testing Cmd+Z for undo...');
  await page.locator('textarea').first().fill('Item to undo');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  
  // Now undo
  await page.keyboard.press(isMac ? 'Meta+z' : 'Control+z');
  await page.waitForTimeout(500);
  
  const undoVisible = await page.locator('text=Item to undo').isVisible().catch(() => false);
  console.log('   Item visible after undo:', undoVisible);
  
  console.log('\n6. Testing Cmd+Shift+Z for redo...');
  await page.keyboard.press(isMac ? 'Meta+Shift+z' : 'Control+Shift+z');
  await page.waitForTimeout(500);
  
  const redoVisible = await page.locator('text=Item to undo').isVisible().catch(() => false);
  console.log('   Item visible after redo:', redoVisible);
  
  await page.waitForTimeout(3000);
  await browser.close();
})();