const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Log console messages
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  
  // Add item
  console.log('1. Clicking Add new item...');
  const addButton = page.locator('.flex-1').locator('button:has-text("Add new item")').first();
  await addButton.click();
  await page.waitForTimeout(500);
  
  // Type text
  console.log('2. Typing text...');
  const textarea = page.locator('textarea').first();
  await textarea.fill('First bullet point');
  
  // Press Enter
  console.log('3. Pressing Enter...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  
  // Check what's on the page
  console.log('4. Checking page content...');
  
  // Check for the div with text
  const divCount = await page.locator('div:has-text("First bullet point")').count();
  console.log('   Divs with "First bullet point":', divCount);
  
  // Check for any div that contains the text
  const allDivs = await page.locator('div').all();
  for (const div of allDivs) {
    const text = await div.textContent();
    if (text && text.includes('First bullet point')) {
      console.log('   Found div with text:', text);
      const classes = await div.getAttribute('class');
      console.log('   Classes:', classes);
    }
  }
  
  // Check if there's still a textarea (for new item)
  const textareaCount = await page.locator('textarea').count();
  console.log('   Textareas on page:', textareaCount);
  
  if (textareaCount > 0) {
    const newTextarea = page.locator('textarea').first();
    const isFocused = await newTextarea.evaluate(el => el === document.activeElement);
    console.log('   New textarea is focused:', isFocused);
  }
  
  // Get the outline content HTML
  const outlineContent = await page.locator('.outline-desktop-content').innerHTML();
  console.log('\n5. Outline HTML (first 1000 chars):');
  console.log(outlineContent.substring(0, 1000));
  
  await page.waitForTimeout(5000); // Keep browser open for inspection
  await browser.close();
})();