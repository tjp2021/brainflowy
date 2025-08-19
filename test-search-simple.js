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
  
  console.log('2. Creating test items manually...');
  // Item 1: JavaScript Tutorial
  await page.locator('button:has-text("Add new item")').first().click();
  await page.waitForSelector('textarea', { state: 'visible', timeout: 5000 });
  await page.locator('textarea').first().fill('JavaScript Tutorial');
  await page.keyboard.press('Enter');
  
  // Item 2: Python Basics
  await page.locator('textarea').first().fill('Python Basics');
  await page.keyboard.press('Enter');
  
  // Item 3: JavaScript Advanced
  await page.locator('textarea').first().fill('JavaScript Advanced');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  
  console.log('3. Testing search for "JavaScript"...');
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill('JavaScript');
  await page.waitForTimeout(500);
  
  console.log('4. Checking filtered results...');
  const jsVisible = await page.locator('text=JavaScript Tutorial').isVisible().catch(() => false);
  const jsAdvVisible = await page.locator('text=JavaScript Advanced').isVisible().catch(() => false);
  const pythonVisible = await page.locator('text=Python Basics').isVisible().catch(() => false);
  
  console.log('   JavaScript Tutorial visible:', jsVisible);
  console.log('   JavaScript Advanced visible:', jsAdvVisible);
  console.log('   Python Basics visible:', pythonVisible);
  
  if (jsVisible && jsAdvVisible && !pythonVisible) {
    console.log('✅ SUCCESS: Search filtering works correctly!');
  } else {
    console.log('❌ ISSUE: Expected JavaScript items visible, Python hidden');
  }
  
  // Check highlighting
  console.log('\n5. Checking highlighting...');
  const highlights = await page.locator('mark').count();
  console.log('   Found', highlights, 'highlighted elements');
  
  if (highlights > 0) {
    const highlightText = await page.locator('mark').first().textContent();
    console.log('   First highlight text:', highlightText);
    console.log('✅ SUCCESS: Search highlighting works!');
  }
  
  // Test case-insensitive
  console.log('\n6. Testing case-insensitive search...');
  await searchInput.clear();
  await searchInput.fill('PYTHON');
  await page.waitForTimeout(500);
  
  const pythonVisibleUpper = await page.locator('text=Python Basics').isVisible().catch(() => false);
  if (pythonVisibleUpper) {
    console.log('✅ SUCCESS: Case-insensitive search works!');
  } else {
    console.log('❌ FAILED: Case-insensitive search not working');
  }
  
  // Test clear
  console.log('\n7. Testing clear search...');
  await searchInput.clear();
  await page.waitForTimeout(500);
  
  const allVisible = [
    await page.locator('text=JavaScript Tutorial').isVisible().catch(() => false),
    await page.locator('text=JavaScript Advanced').isVisible().catch(() => false),
    await page.locator('text=Python Basics').isVisible().catch(() => false)
  ];
  
  if (allVisible.every(v => v === true)) {
    console.log('✅ SUCCESS: Clear search shows all items!');
  } else {
    console.log('❌ FAILED: Some items still hidden after clear');
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();