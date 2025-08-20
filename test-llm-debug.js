const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');
    
    // Check if we're on the landing page
    const needsLogin = await page.locator('text="Welcome to BrainFlowy"').count() > 0;
    
    if (needsLogin) {
      console.log('Need to login, navigating to login page...');
      // Navigate directly to login page
      await page.goto('http://localhost:5173/login');
      await page.waitForTimeout(1000);
      
      console.log('Filling login form...');
      await page.fill('input[type="email"]', 'testuser@example.com');
      await page.fill('input[type="password"]', 'Test1234!');
      
      // Find and click the submit button
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      console.log('Waiting for navigation...');
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
    }
    
    console.log('On outline page, taking screenshot...');
    await page.screenshot({ path: 'llm-ui-state.png', fullPage: true });
    
    // Check if AI Assistant button exists
    const aiButtonCount = await page.locator('button:has-text("AI Assistant")').count();
    console.log('AI Assistant button count:', aiButtonCount);
    
    if (aiButtonCount > 0) {
      console.log('Clicking AI Assistant button...');
      await page.click('button:has-text("AI Assistant")');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'llm-panel-open.png', fullPage: true });
      console.log('Panel opened, screenshot saved');
    } else {
      console.log('AI Assistant button not found');
      // Log all buttons on the page
      const buttons = await page.locator('button').allTextContents();
      console.log('Available buttons:', buttons);
    }
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-state.png', fullPage: true });
  }
  
  console.log('Test complete. Browser will stay open for inspection.');
  // Keep browser open for manual inspection
  await page.waitForTimeout(30000);
  
  await browser.close();
})();