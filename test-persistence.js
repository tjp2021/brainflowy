const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('backend') || text.includes('Item') || text.includes('created') || text.includes('updated')) {
      console.log('CONSOLE:', text);
    }
  });
  
  // Listen for network requests to backend
  page.on('response', response => {
    const url = response.url();
    if (url.includes('outlines') || url.includes('items')) {
      console.log(`API Response: ${url} - Status: ${response.status()}`);
    }
  });
  
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  
  console.log('1. Registering new user...');
  await page.goto('http://localhost:5176');
  await page.click('text=Sign up');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'Test123!');
  await page.fill('input[name="confirmPassword"]', 'Test123!');
  await page.click('button[type="submit"]');
  
  console.log('2. Waiting for redirect to outlines...');
  await page.waitForURL(/\/outlines/, { timeout: 10000 });
  console.log('   Redirected to:', page.url());
  
  console.log('3. Adding new item...');
  await page.click('button:has-text("Add new item")');
  
  console.log('4. Typing text...');
  const textarea = page.locator('textarea').first();
  await textarea.fill(`Test Item ${timestamp}`);
  
  console.log('5. Pressing Enter to save...');
  await page.keyboard.press('Enter');
  
  console.log('6. Waiting for item to appear...');
  await page.waitForTimeout(2000);
  
  console.log('7. Refreshing page...');
  await page.reload();
  
  console.log('8. Checking if item persisted...');
  await page.waitForTimeout(2000);
  
  // Check if the item is visible
  const itemText = `Test Item ${timestamp}`;
  const itemVisible = await page.locator(`text="${itemText}"`).isVisible().catch(() => false);
  
  if (itemVisible) {
    console.log('✅ SUCCESS: Item persisted after refresh!');
  } else {
    console.log('❌ FAILED: Item did not persist after refresh');
    
    // Check what's on the page
    const pageContent = await page.locator('.outline-desktop-content').textContent().catch(() => 'Could not get content');
    console.log('Page content:', pageContent);
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();