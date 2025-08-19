const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('ERROR:', msg.text());
    } else if (msg.text().includes('egistration') || msg.text().includes('register')) {
      console.log('LOG:', msg.text());
    }
  });
  
  // Listen for network requests
  page.on('response', response => {
    if (response.url().includes('auth')) {
      console.log(`Response: ${response.url()} - ${response.status()}`);
    }
  });
  
  await page.goto('http://localhost:5176');
  
  // Click Sign up link
  console.log('1. Looking for Sign up link...');
  const signupLink = await page.locator('text=Sign up').first();
  if (await signupLink.isVisible()) {
    console.log('   Found Sign up link, clicking...');
    await signupLink.click();
    await page.waitForTimeout(1000);
  } else {
    console.log('   Sign up link not found');
  }
  
  console.log('2. Current URL:', page.url());
  
  // Check if we're on register page
  if (page.url().includes('register')) {
    console.log('3. On register page, filling form...');
    
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
    
    console.log('4. Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    console.log('5. After submit URL:', page.url());
    
    // Check for error messages
    const errorMessage = await page.locator('.error-message').textContent().catch(() => null);
    if (errorMessage) {
      console.log('   Error message:', errorMessage);
    }
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();