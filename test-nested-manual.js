const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  
  console.log('🔵 Step 1: Navigating to app...');
  await page.goto('http://localhost:5173/');
  
  console.log('🔵 Step 2: Registering new user...');
  await page.click('text=Get Started');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.fill('input[name="confirmPassword"]', testPassword);
  await page.click('button:has-text("Sign Up")');
  
  console.log('🔵 Step 3: Waiting for redirect to outlines page...');
  await page.waitForURL('**/outlines');
  await page.waitForTimeout(2000);
  
  console.log('🔵 Step 4: Creating main bullet...');
  // Click the add button or find the first input
  const addButton = await page.locator('button:has-text("Add new item")');
  if (await addButton.isVisible()) {
    await addButton.click();
  }
  
  // Type main task
  await page.keyboard.type('MAIN TASK 1');
  await page.keyboard.press('Enter');
  
  console.log('🔵 Step 5: Creating sub-bullet (Tab to indent)...');
  await page.keyboard.type('Sub-task 1.1');
  await page.keyboard.press('Tab'); // Indent
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  
  console.log('🔵 Step 6: Creating another sub-bullet...');
  await page.keyboard.type('Sub-task 1.2');
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  
  console.log('🔵 Step 7: Creating sub-sub-bullet...');
  await page.keyboard.type('Sub-sub-task 1.2.1');
  await page.keyboard.press('Tab'); // Indent further
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  
  console.log('🔵 Step 8: Creating another sub-sub-bullet...');
  await page.keyboard.type('Sub-sub-task 1.2.2');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape'); // Stop editing
  
  console.log('⏳ Waiting 3 seconds for saves to complete...');
  await page.waitForTimeout(3000);
  
  console.log('📸 Taking screenshot before logout...');
  await page.screenshot({ path: 'before-logout.png', fullPage: true });
  
  // Check what we have - look for textareas that contain our text
  const allTextareas = await page.locator('textarea').allTextContents();
  console.log('📝 All textareas before logout:', allTextareas);
  
  const visibleTexts = await page.locator('textarea').evaluateAll(elements => 
    elements.map(el => el.value || el.textContent).filter(text => text && text.trim())
  );
  console.log('📝 Items with content before logout:', visibleTexts);
  
  console.log('🔵 Step 9: Logging out...');
  const logoutButton = await page.locator('button:has-text("Logout")').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }
  await page.waitForURL('**/');
  
  console.log('🔵 Step 10: Logging back in...');
  await page.click('text=Sign In');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button:has-text("Sign In")');
  
  console.log('🔵 Step 11: Waiting for outlines page to load...');
  await page.waitForURL('**/outlines');
  await page.waitForTimeout(3000);
  
  console.log('📸 Taking screenshot after login...');
  await page.screenshot({ path: 'after-login.png', fullPage: true });
  
  // Check what we have now
  const allTextareasAfter = await page.locator('textarea').allTextContents();
  console.log('📝 All textareas after login:', allTextareasAfter);
  
  const visibleTextsAfter = await page.locator('textarea').evaluateAll(elements => 
    elements.map(el => el.value || el.textContent).filter(text => text && text.trim())
  );
  console.log('📝 Items with content after login:', visibleTextsAfter);
  
  // Check for specific items
  const mainTask = await page.locator('text=MAIN TASK 1').isVisible();
  const subTask1 = await page.locator('text=Sub-task 1.1').isVisible();
  const subTask2 = await page.locator('text=Sub-task 1.2').isVisible();
  const subSubTask1 = await page.locator('text=Sub-sub-task 1.2.1').isVisible();
  const subSubTask2 = await page.locator('text=Sub-sub-task 1.2.2').isVisible();
  
  console.log('\n🔍 VERIFICATION RESULTS:');
  console.log('Main Task 1:', mainTask ? '✅' : '❌');
  console.log('Sub-task 1.1:', subTask1 ? '✅' : '❌');
  console.log('Sub-task 1.2:', subTask2 ? '✅' : '❌');
  console.log('Sub-sub-task 1.2.1:', subSubTask1 ? '✅' : '❌');
  console.log('Sub-sub-task 1.2.2:', subSubTask2 ? '✅' : '❌');
  
  const allPresent = mainTask && subTask1 && subTask2 && subSubTask1 && subSubTask2;
  
  if (allPresent) {
    console.log('\n✅✅✅ SUCCESS: All nested items persisted correctly!');
  } else {
    console.log('\n❌❌❌ FAILURE: Some items were lost after logout/login!');
  }
  
  console.log('\nPress Ctrl+C to close the browser...');
  // Keep browser open for inspection
  await page.waitForTimeout(60000);
  
  await browser.close();
})();