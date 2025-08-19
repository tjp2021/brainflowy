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
  
  console.log('2. Creating test items...');
  const items = [
    'JavaScript Tutorial',
    'Python Basics',
    'JavaScript Advanced',
    'Ruby Programming',
    'Python Data Science'
  ];
  
  for (const item of items) {
    await page.click('button:has-text("Add new item")');
    await page.waitForSelector('textarea', { timeout: 5000 });
    const textarea = page.locator('textarea').first();
    await textarea.fill(item);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  
  console.log('3. Testing search...');
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill('JavaScript');
  await page.waitForTimeout(1000);
  
  console.log('4. Checking visibility...');
  const jsVisible = await page.locator('text=JavaScript Tutorial').isVisible().catch(() => false);
  const jsAdvVisible = await page.locator('text=JavaScript Advanced').isVisible().catch(() => false);
  const pythonVisible = await page.locator('text=Python Basics').isVisible().catch(() => false);
  const rubyVisible = await page.locator('text=Ruby Programming').isVisible().catch(() => false);
  
  console.log('   JavaScript Tutorial visible:', jsVisible);
  console.log('   JavaScript Advanced visible:', jsAdvVisible);
  console.log('   Python Basics visible:', pythonVisible);
  console.log('   Ruby Programming visible:', rubyVisible);
  
  if (jsVisible && jsAdvVisible && !pythonVisible && !rubyVisible) {
    console.log('✅ SUCCESS: Search filtering works!');
  } else {
    console.log('❌ FAILED: Search filtering not working correctly');
  }
  
  // Check highlighting
  console.log('\n5. Checking highlighting...');
  const highlighted = await page.locator('mark').count();
  console.log('   Highlighted elements:', highlighted);
  
  if (highlighted > 0) {
    console.log('✅ SUCCESS: Search highlighting works!');
  } else {
    console.log('⚠️  No highlighting found');
  }
  
  // Test clear search
  console.log('\n6. Testing clear search...');
  await searchInput.clear();
  await page.waitForTimeout(1000);
  
  const pythonVisibleAfter = await page.locator('text=Python Basics').isVisible().catch(() => false);
  if (pythonVisibleAfter) {
    console.log('✅ SUCCESS: Clear search shows all items!');
  } else {
    console.log('❌ FAILED: Clear search not working');
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();