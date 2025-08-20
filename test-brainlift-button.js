const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Go to the app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // Check if we're already logged in or need to register
  const registerButton = await page.$('text=Sign up');
  
  if (registerButton) {
    console.log('Not logged in, registering...');
    await registerButton.click();
    
    // Fill registration form
    const timestamp = Date.now();
    await page.fill('input[type="email"]', `test${timestamp}@example.com`);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder*="name" i]', 'Test User');
    
    // Find and click the submit button
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    } else {
      // Try finding by text
      await page.click('text=Register');
    }
    
    // Wait for navigation
    await page.waitForTimeout(3000);
  }
  
  // Now look for the Create Brainlift button
  console.log('Looking for Create Brainlift button...');
  
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'dashboard-view.png', fullPage: true });
  
  // Try to find the button
  const brainliftButton = await page.$('button:has-text("Create Brainlift")');
  
  if (brainliftButton) {
    console.log('✅ Found Create Brainlift button!');
    
    // Click it
    await brainliftButton.click();
    await page.waitForTimeout(2000);
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'after-brainlift-click.png', fullPage: true });
    
    // Check for template content
    const titleSection = await page.$('text=[Title]: [Subtitle]');
    if (titleSection) {
      console.log('✅ Template loaded successfully!');
    } else {
      console.log('❌ Template content not found');
    }
  } else {
    console.log('❌ Create Brainlift button not found');
    
    // Let's see what buttons are available
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(b => b.textContent?.trim()).filter(Boolean)
    );
    console.log('Available buttons:', buttons);
  }
  
  // Keep browser open for inspection
  await page.waitForTimeout(5000);
  await browser.close();
})();