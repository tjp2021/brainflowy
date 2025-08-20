const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    }
  });
  
  // Go to the app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // Click Sign Up to register
  await page.click('text=Sign Up');
  await page.waitForTimeout(1000);
  
  // Create unique test user
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  const password = 'password123';
  
  // Fill registration form using IDs
  await page.fill('#displayName', 'Test User');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);
  
  console.log('Registering with email:', email);
  
  // Click Sign Up button
  await page.click('button:has-text("Sign Up")');
  
  // Wait for navigation to outlines page
  await page.waitForURL('**/outlines', { timeout: 10000 });
  
  console.log('Successfully logged in! Current URL:', page.url());
  
  // Click Create Brainlift button
  const brainliftButton = await page.$('button:has-text("Create Brainlift")');
  if (brainliftButton) {
    console.log('✅ Found Create Brainlift button, clicking...');
    await brainliftButton.click();
    
    // Wait longer to see if items are being saved
    await page.waitForTimeout(5000);
    
    // Check if template loaded
    const titleSection = await page.$('text=[Title]: [Subtitle]');
    if (titleSection) {
      console.log('✅ Template visible in UI');
    }
  }
  
  console.log('Waiting 10 seconds to observe console logs...');
  await page.waitForTimeout(10000);
  await browser.close();
})();