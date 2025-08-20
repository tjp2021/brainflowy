const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Go to the app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // Click Sign Up to register
  await page.click('text=Sign Up');
  await page.waitForTimeout(1000);
  
  // Create unique test user
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  
  // Fill registration form using IDs
  await page.fill('#displayName', 'Test User');
  await page.fill('#email', email);
  await page.fill('#password', 'password123');
  await page.fill('#confirmPassword', 'password123');
  
  console.log('Registering with email:', email);
  
  // Click Sign Up button
  await page.click('button:has-text("Sign Up")');
  
  // Wait for navigation to outlines page
  await page.waitForURL('**/outlines', { timeout: 10000 });
  
  console.log('Successfully logged in! Current URL:', page.url());
  
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
      
      // Check for other key sections
      const sections = [
        'Owner',
        'Purpose',
        'Out of scope:',
        'Initiative Overview:',
        '1.1-SPOV',
        'DOK3 - Insights',
        'Expert Advisory Council'
      ];
      
      for (const section of sections) {
        const element = await page.$(`text=${section}`);
        if (element) {
          console.log(`  ✓ Found section: ${section}`);
        }
      }
    } else {
      console.log('❌ Template content not found');
      
      // Check what text is visible
      const allText = await page.evaluate(() => document.body.innerText);
      console.log('Page contains "[Title]":', allText.includes('[Title]'));
      
      // Get first few lines of text
      const lines = allText.split('\n').slice(0, 10);
      console.log('First 10 lines:', lines);
    }
  } else {
    console.log('❌ Create Brainlift button not found');
    
    // Let's see what buttons are available
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(b => b.textContent?.trim()).filter(Boolean)
    );
    console.log('Available buttons:', buttons);
    
    // Check for all text with "Brainlift"
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('Brainlift')) {
      console.log('Page contains "Brainlift" text somewhere');
    }
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();