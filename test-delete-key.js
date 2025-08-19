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
  
  console.log('\n2. Creating test items...');
  // Create three items
  for (let i = 1; i <= 3; i++) {
    await page.click('button:has-text("Add new item")');
    await page.locator('textarea').first().fill(`Item ${i}`);
    await page.keyboard.press('Enter');
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  
  console.log('\n3. Testing single item deletion...');
  const isMac = process.platform === 'darwin';
  
  // Click on Item 2 to select it (with Ctrl/Cmd for selection)
  await page.click('text=Item 2', { modifiers: [isMac ? 'Meta' : 'Control'] });
  await page.waitForTimeout(500);
  
  // Check if item is selected
  const item2 = page.locator('.group:has-text("Item 2")').first();
  const item2Classes = await item2.getAttribute('class');
  console.log('   Item 2 classes after selection:', item2Classes);
  
  if (item2Classes && item2Classes.includes('bg-blue-50')) {
    console.log('   ✅ Item 2 selected');
  }
  
  // Press Delete
  await page.keyboard.press('Delete');
  await page.waitForTimeout(500);
  
  // Handle confirmation dialog
  await page.evaluate(() => {
    // Override confirm to always return true
    window.confirm = () => true;
  });
  
  // Try delete again after overriding confirm
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1000);
  
  // Check if item was deleted
  const item2Visible = await page.locator('text=Item 2').isVisible().catch(() => false);
  console.log('   Item 2 visible after delete:', item2Visible);
  
  if (!item2Visible) {
    console.log('   ✅ Delete key works for single item!');
  } else {
    console.log('   ❌ Delete key not working');
  }
  
  // Verify other items are still there
  const item1Visible = await page.locator('text=Item 1').isVisible().catch(() => false);
  const item3Visible = await page.locator('text=Item 3').isVisible().catch(() => false);
  console.log('   Item 1 still visible:', item1Visible);
  console.log('   Item 3 still visible:', item3Visible);
  
  console.log('\n4. Testing multiple item deletion with Cmd+A...');
  // Select all
  await page.keyboard.press(isMac ? 'Meta+a' : 'Control+a');
  await page.waitForTimeout(500);
  
  // Count selected items
  const selectedItems = await page.locator('.bg-blue-50').count();
  console.log('   Selected items:', selectedItems);
  
  // Press Delete
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1000);
  
  // Check if items were deleted
  const remainingItems = await page.locator('.group').count();
  console.log('   Remaining items after delete all:', remainingItems);
  
  if (remainingItems === 0 || remainingItems === 1) { // Might have "Add new item" button group
    console.log('   ✅ Delete all works!');
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();