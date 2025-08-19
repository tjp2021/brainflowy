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
  
  console.log('\n2. Testing drag handle visibility...');
  // Create an item
  await page.click('button:has-text("Add new item")');
  await page.locator('textarea').fill('Test Item');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  
  // Check for drag handle
  const dragHandles = await page.locator('[data-drag-handle], .drag-handle').count();
  console.log('   Drag handles found:', dragHandles);
  
  if (dragHandles > 0) {
    // Check initial visibility
    const handle = page.locator('[data-drag-handle], .drag-handle').first();
    const initialOpacity = await handle.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    console.log('   Initial handle opacity:', initialOpacity);
    
    // Hover over item
    const item = page.locator('.group:has-text("Test Item")').first();
    await item.hover();
    await page.waitForTimeout(500);
    
    const hoverOpacity = await handle.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    console.log('   Handle opacity on hover:', hoverOpacity);
    
    if (parseFloat(hoverOpacity) > parseFloat(initialOpacity)) {
      console.log('   ✅ Drag handle appears on hover!');
    } else {
      console.log('   ❌ Drag handle visibility not changing on hover');
    }
  } else {
    console.log('   ❌ No drag handles found - need to implement');
  }
  
  console.log('\n3. Testing basic drag operation...');
  // Create two items
  await page.click('button:has-text("Add new item")');
  await page.locator('textarea').fill('Item A');
  await page.keyboard.press('Enter');
  await page.locator('textarea').fill('Item B');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  
  // Try to drag Item A
  const itemA = page.locator('.group:has-text("Item A")').first();
  const itemAInitialBox = await itemA.boundingBox();
  
  // Look for drag handle on Item A
  await itemA.hover();
  const itemAHandle = itemA.locator('[data-drag-handle], .drag-handle').first();
  
  if (await itemAHandle.isVisible().catch(() => false)) {
    console.log('   Found drag handle for Item A');
    
    // Try dragging
    await itemAHandle.hover();
    await page.mouse.down();
    await page.mouse.move(itemAInitialBox.x, itemAInitialBox.y + 100);
    
    // Check for visual feedback
    const itemOpacity = await itemA.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    console.log('   Item opacity during drag:', itemOpacity);
    
    // Check for drop indicator
    const dropIndicator = await page.locator('.drop-indicator, .drop-line, [data-drop-indicator]').isVisible().catch(() => false);
    console.log('   Drop indicator visible:', dropIndicator);
    
    await page.mouse.up();
    
    // Check final order
    const items = page.locator('.outline-desktop-content .group');
    const firstItemText = await items.nth(0).textContent();
    const secondItemText = await items.nth(1).textContent();
    console.log('   Final order:', [firstItemText?.trim(), secondItemText?.trim()]);
  } else {
    console.log('   ❌ No drag handle visible - cannot test drag');
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();