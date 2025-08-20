const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');
    
    // Register a new user
    console.log('Registering new user...');
    await page.click('text=Sign up');
    
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder*="name" i]', 'Test User');
    
    await page.click('button[type="submit"]');
    
    // Wait for navigation to outlines page
    await page.waitForURL('**/outlines', { timeout: 10000 });
    console.log('Successfully logged in and on outlines page');
    
    // Add a test item
    console.log('Adding test item...');
    await page.click('button:has-text("Add new item")');
    await page.waitForTimeout(500);
    
    // Type in the textarea that appears
    const textarea = page.locator('textarea').first();
    await textarea.fill('Test item for AI editing');
    await textarea.press('Enter');
    await page.waitForTimeout(500);
    
    // Check if inline AI button exists (should appear on hover)
    console.log('Looking for inline AI buttons...');
    const outlineItem = page.locator('.group').first();
    await outlineItem.hover();
    await page.waitForTimeout(500);
    
    // Look for the sparkles icon button
    const inlineAIButton = outlineItem.locator('button:has(svg.lucide-sparkles)');
    const buttonCount = await inlineAIButton.count();
    console.log('Inline AI button count:', buttonCount);
    
    if (buttonCount > 0) {
      console.log('Found inline AI button! Clicking it...');
      await inlineAIButton.click();
      await page.waitForTimeout(1000);
      
      // Check if the AI panel opened
      const aiPanelVisible = await page.locator('h2:has-text("AI Assistant")').isVisible();
      console.log('AI Assistant panel visible:', aiPanelVisible);
      
      // Check if it's in edit mode
      const editModeActive = await page.locator('button:has-text("Edit").bg-blue-100').count() > 0;
      console.log('Edit mode active:', editModeActive);
      
      // Check if the current item is shown
      const currentItemText = await page.locator('text="Editing: Test item for AI editing"').count() > 0;
      console.log('Shows current item:', currentItemText);
      
      await page.screenshot({ path: 'inline-ai-panel-open.png', fullPage: true });
    } else {
      console.log('No inline AI button found');
    }
    
    // Also check the main AI Assistant button
    console.log('Checking main AI Assistant button...');
    const mainAIButton = await page.locator('button:has-text("AI Assistant")').count();
    console.log('Main AI Assistant button count:', mainAIButton);
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'inline-ai-error.png', fullPage: true });
  }
  
  console.log('Test complete. Browser will close in 5 seconds...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();