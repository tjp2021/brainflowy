const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  
  console.log('1. Registering and logging in...');
  await page.goto('http://localhost:5176');
  await page.click('text=Sign up');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'Test123!');
  await page.fill('input[name="confirmPassword"]', 'Test123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/outlines/, { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('\n2. Testing Cmd+B for bold/header...');
  await page.click('button:has-text("Add new item")');
  await page.waitForSelector('textarea', { state: 'visible' });
  const textarea = page.locator('textarea').first();
  await textarea.fill('Test Bold Text');
  
  // Try Cmd+B (Mac) or Ctrl+B (Windows/Linux)
  const isMac = process.platform === 'darwin';
  await page.keyboard.press(isMac ? 'Meta+b' : 'Control+b');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  // Look for the item with different selectors
  console.log('   Looking for bold item...');
  
  // Check for the text itself
  const textExists = await page.locator('text=Test Bold Text').count();
  console.log('   Text "Test Bold Text" found:', textExists, 'times');
  
  // Find divs containing the text
  const divs = await page.locator('div:has-text("Test Bold Text")').all();
  console.log('   Found', divs.length, 'divs with the text');
  
  // Check each div for style classes
  for (let i = 0; i < divs.length; i++) {
    const classes = await divs[i].getAttribute('class');
    const computedStyle = await divs[i].evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontWeight: styles.fontWeight,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        fontStyle: styles.fontStyle
      };
    });
    console.log(`   Div ${i} classes:`, classes);
    console.log(`   Div ${i} computed styles:`, computedStyle);
    
    // Check if it has bold styles
    if (classes && (classes.includes('font-bold') || classes.includes('text-base') || classes.includes('text-lg'))) {
      console.log('   ✅ Found bold styling!');
    }
  }
  
  console.log('\n3. Testing Cmd+I for italic/quote...');
  await page.locator('textarea').first().fill('Test Italic Text');
  await page.keyboard.press(isMac ? 'Meta+i' : 'Control+i');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  const italicDivs = await page.locator('div:has-text("Test Italic Text")').all();
  for (let i = 0; i < italicDivs.length; i++) {
    const classes = await italicDivs[i].getAttribute('class');
    const computedStyle = await italicDivs[i].evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontStyle: styles.fontStyle,
        borderLeft: styles.borderLeft
      };
    });
    console.log(`   Div ${i} classes:`, classes);
    console.log(`   Div ${i} computed styles:`, computedStyle);
    
    if (classes && (classes.includes('italic') || classes.includes('border-l'))) {
      console.log('   ✅ Found italic/quote styling!');
    }
  }
  
  console.log('\n4. Testing Cmd+E for code...');
  await page.locator('textarea').first().fill('const code = true');
  await page.keyboard.press(isMac ? 'Meta+e' : 'Control+e');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  const codeDivs = await page.locator('div:has-text("const code = true")').all();
  for (let i = 0; i < codeDivs.length; i++) {
    const classes = await codeDivs[i].getAttribute('class');
    const computedStyle = await codeDivs[i].evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontFamily: styles.fontFamily
      };
    });
    console.log(`   Div ${i} classes:`, classes);
    console.log(`   Div ${i} computed styles:`, computedStyle);
    
    if (classes && classes.includes('font-mono')) {
      console.log('   ✅ Found code styling!');
    }
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();