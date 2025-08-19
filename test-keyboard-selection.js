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
  
  console.log('\n3. Testing Cmd+A for select all...');
  const isMac = process.platform === 'darwin';
  
  // Click on the outline area first to give it focus
  await page.click('.outline-desktop-content');
  await page.keyboard.press(isMac ? 'Meta+a' : 'Control+a');
  await page.waitForTimeout(500);
  
  // Check if items are selected
  const items = await page.locator('.outline-desktop-content .group').all();
  console.log('   Found', items.length, 'items');
  
  let selectedCount = 0;
  for (let i = 0; i < items.length; i++) {
    const classes = await items[i].getAttribute('class');
    console.log(`   Item ${i} classes:`, classes);
    if (classes && (classes.includes('selected') || classes.includes('bg-blue-50') || classes.includes('border-blue'))) {
      selectedCount++;
    }
  }
  console.log('   Selected items:', selectedCount);
  
  if (selectedCount === items.length && selectedCount > 0) {
    console.log('   ✅ All items selected!');
  } else {
    console.log('   ❌ Select all not working');
  }
  
  console.log('\n4. Testing Delete key...');
  // First select an item
  await page.click('text=Item 2');
  await page.waitForTimeout(500);
  
  // Press Delete
  await page.keyboard.press('Delete');
  await page.waitForTimeout(500);
  
  // Check if confirm dialog appears
  const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")');
  if (await confirmButton.isVisible().catch(() => false)) {
    console.log('   Confirmation dialog appeared');
    await confirmButton.click();
    await page.waitForTimeout(500);
  }
  
  // Check if item was deleted
  const item2Visible = await page.locator('text=Item 2').isVisible().catch(() => false);
  console.log('   Item 2 visible after delete:', item2Visible);
  
  if (!item2Visible) {
    console.log('   ✅ Delete key works!');
  } else {
    console.log('   ❌ Delete key not working');
  }
  
  // Verify other items are still there
  const item1Visible = await page.locator('text=Item 1').isVisible().catch(() => false);
  const item3Visible = await page.locator('text=Item 3').isVisible().catch(() => false);
  console.log('   Item 1 still visible:', item1Visible);
  console.log('   Item 3 still visible:', item3Visible);
  
  await page.waitForTimeout(3000);
  await browser.close();
})();