const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Go to the app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // Click Sign Up to register
  await page.click('text=Sign Up');
  await page.waitForTimeout(500);
  
  // Create unique test user
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  
  // Fill registration form
  await page.fill('input[placeholder="Test User"]', 'Test User');
  await page.fill('input[placeholder="test@brainflowy.com"]', email);
  await page.fill('input[placeholder="password123"]', 'password123');
  await page.fill('input[placeholder="Re-enter your password"]', 'password123');
  
  console.log('Registering with email:', email);
  
  // Click Sign Up button
  await page.click('button:has-text("Sign Up")');
  
  // Wait for navigation to dashboard
  await page.waitForTimeout(3000);
  
  console.log('Current URL:', page.url());
  
  // Take screenshot to see what we have
  await page.screenshot({ path: 'after-registration.png', fullPage: true });
  
  // Look for the Create Brainlift button
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
      
      // Check what text is visible
      const allText = await page.evaluate(() => document.body.innerText);
      console.log('Page text includes Brainlift content:', allText.includes('[Title]'));
    }
  } else {
    console.log('❌ Create Brainlift button not found');
    
    // Let's see what buttons are available
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(b => b.textContent?.trim()).filter(Boolean)
    );
    console.log('Available buttons:', buttons);
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();