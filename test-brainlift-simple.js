const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Go to the app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // Click Sign In
  await page.click('text=Sign In');
  await page.waitForTimeout(500);
  
  // Use the test credentials shown on the page
  await page.fill('input[type="email"]', 'test@brainflowy.com');
  await page.fill('input[type="password"]', 'password123');
  
  // Click Sign In button
  await page.click('button:has-text("Sign In")');
  
  // Wait for dashboard to load
  await page.waitForTimeout(3000);
  
  console.log('Current URL:', page.url());
  
  // Take screenshot to see what we have
  await page.screenshot({ path: 'logged-in-view.png', fullPage: true });
  
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
    }
  } else {
    console.log('❌ Create Brainlift button not found');
    
    // Let's see what buttons are available
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(b => b.textContent?.trim()).filter(Boolean)
    );
    console.log('Available buttons:', buttons);
    
    // Also check for any elements with "Brainlift" text
    const brainliftElements = await page.$$eval('*', elements => 
      elements.filter(el => el.textContent?.includes('Brainlift')).map(el => el.textContent?.trim())
    );
    console.log('Elements with "Brainlift":', brainliftElements.slice(0, 5));
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();