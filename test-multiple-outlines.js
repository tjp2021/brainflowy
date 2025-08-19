const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Loaded') || text.includes('outline') || text.includes('items')) {
      console.log('CONSOLE:', text);
    }
  });
  
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
  
  console.log('2. Creating first outline...');
  await page.click('button:has-text("New Outline")');
  await page.waitForTimeout(500);
  await page.fill('input[placeholder="Outline name"]', 'Project Alpha');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  console.log('3. Adding item to first outline...');
  await page.click('button:has-text("Add new item")');
  await page.locator('textarea').first().fill('Alpha Task 1');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  
  console.log('4. Creating second outline...');
  await page.click('button:has-text("New Outline")');
  await page.waitForTimeout(500);
  await page.fill('input[placeholder="Outline name"]', 'Project Beta');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  console.log('5. Adding item to second outline...');
  await page.click('button:has-text("Add new item")');
  await page.locator('textarea').first().fill('Beta Task 1');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  
  console.log('6. Switching back to Project Alpha...');
  await page.click('text=Project Alpha');
  await page.waitForTimeout(2000);
  
  console.log('7. Checking visibility...');
  const alphaVisible = await page.locator('text=Alpha Task 1').isVisible().catch(() => false);
  const betaVisible = await page.locator('text=Beta Task 1').isVisible().catch(() => false);
  
  console.log(`   Alpha Task 1 visible: ${alphaVisible}`);
  console.log(`   Beta Task 1 visible: ${betaVisible}`);
  
  if (alphaVisible && !betaVisible) {
    console.log('✅ SUCCESS: Outline switching works!');
  } else {
    console.log('❌ FAILED: Outline switching not working properly');
    const content = await page.locator('.outline-desktop-content').textContent().catch(() => 'Could not get content');
    console.log('   Current content:', content);
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();