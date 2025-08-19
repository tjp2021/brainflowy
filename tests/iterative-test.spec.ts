import { test, expect } from '@playwright/test';

test('Iterative Outline Test', async ({ page }) => {
  // ============ TEST 1: Page Loads ============
  console.log('\n=== TEST 1: Page loads ===');
  await page.goto('http://localhost:5176/outlines');
  await page.waitForLoadState('networkidle');
  const title = await page.title();
  console.log('✓ Page loaded, title:', title);
  
  // ============ TEST 2: See existing content ============
  console.log('\n=== TEST 2: Check existing content ===');
  const bodyText = await page.locator('body').innerText();
  const hasOutlines = bodyText.includes('My Outlines');
  console.log('✓ Has "My Outlines":', hasOutlines);
  
  // ============ TEST 3: Find Marketing Campaign text ============
  console.log('\n=== TEST 3: Find demo content ===');
  const marketingCampaign = await page.getByText('Marketing Campaign').count();
  console.log('✓ Found "Marketing Campaign":', marketingCampaign > 0);
  
  // UNCOMMENT NEXT TEST AFTER PREVIOUS PASSES
  
  // ============ TEST 4: Double-click to edit ============
  console.log('\n=== TEST 4: Double-click Marketing Campaign ===');
  if (marketingCampaign > 0) {
    await page.getByText('Marketing Campaign').first().dblclick();
    await page.waitForTimeout(500);
    const hasFocus = await page.locator(':focus').count() > 0;
    console.log('✓ Something has focus after double-click:', hasFocus);
  }
  
  // ============ TEST 5: Type in focused element ============
  console.log('\n=== TEST 5: Type in focused element ===');
  const focusedElement = page.locator(':focus');
  if (await focusedElement.count() > 0) {
    await focusedElement.type('EDITED TEXT');
    console.log('✓ Typed "EDITED TEXT"');
  }
  
  /*
  // ============ TEST 6: Press Enter ============
  console.log('\n=== TEST 6: Press Enter ===');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  console.log('✓ Pressed Enter');
  */
  
  /*
  // ============ TEST 7: Check if text changed ============
  console.log('\n=== TEST 7: Check if text updated ===');
  const editedText = await page.getByText('EDITED TEXT').count();
  console.log('✓ Found "EDITED TEXT":', editedText > 0);
  */
  
  /*
  // ============ TEST 8: Create new item with Tab ============
  console.log('\n=== TEST 8: Create indented item ===');
  await page.keyboard.type('Indented Item');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  console.log('✓ Created indented item');
  */
  
  /*
  // ============ TEST 9: Reload and check persistence ============
  console.log('\n=== TEST 9: Reload page ===');
  await page.reload();
  await page.waitForLoadState('networkidle');
  const stillHasEdited = await page.getByText('EDITED TEXT').count() > 0;
  console.log('✓ After reload, "EDITED TEXT" persisted:', stillHasEdited);
  */
  
  // Final screenshot
  await page.screenshot({ path: 'test-results/iterative-final.png' });
  console.log('\n✓ Test complete!');
});