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
    await page.waitForTimeout(3000); // Give time for save
    
    // Check if template loaded
    const titleSection = await page.$('text=[Title]: [Subtitle]');
    if (titleSection) {
      console.log('✅ Template loaded successfully!');
    }
    
    // Now logout and login again to test persistence
    console.log('\n--- Testing persistence ---');
    
    // Click logout
    await page.click('text=Logout');
    await page.waitForTimeout(2000);
    
    // Should be at login page now
    console.log('Logged out, now logging back in...');
    
    // Click Sign In
    await page.click('text=Sign In');
    await page.waitForTimeout(500);
    
    // Login with same credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Sign In")');
    
    // Wait for dashboard to load
    await page.waitForURL('**/outlines', { timeout: 10000 });
    console.log('Logged back in!');
    
    await page.waitForTimeout(2000);
    
    // Check if template items are still there
    const titleAfterRelogin = await page.$('text=[Title]: [Subtitle]');
    const ownerAfterRelogin = await page.$('text=Owner');
    const purposeAfterRelogin = await page.$('text=Purpose');
    const spovAfterRelogin = await page.$('text=SPOV DOK 4');
    
    if (titleAfterRelogin && ownerAfterRelogin && purposeAfterRelogin && spovAfterRelogin) {
      console.log('✅ SUCCESS: Template persisted after logout/login!');
      console.log('  ✓ Title section found');
      console.log('  ✓ Owner section found');
      console.log('  ✓ Purpose section found');
      console.log('  ✓ SPOV DOK 4 section found');
    } else {
      console.log('❌ FAILURE: Template did not persist!');
      console.log('  Title:', titleAfterRelogin ? 'Found' : 'Missing');
      console.log('  Owner:', ownerAfterRelogin ? 'Found' : 'Missing');
      console.log('  Purpose:', purposeAfterRelogin ? 'Found' : 'Missing');
      console.log('  SPOV:', spovAfterRelogin ? 'Found' : 'Missing');
      
      // Take screenshot to see what's there
      await page.screenshot({ path: 'after-relogin.png', fullPage: true });
      console.log('Screenshot saved to after-relogin.png');
    }
    
  } else {
    console.log('❌ Create Brainlift button not found');
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();