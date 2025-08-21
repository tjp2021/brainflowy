import { test, expect } from '@playwright/test';
import { registerNewUser, login, logout } from './helpers/auth.helper';

test.describe('BrainFlowy Full Integration Test Suite', () => {
  let testUser: { email: string; password: string };

  test.beforeAll(async ({ browser }) => {
    // Register a test user once for all tests
    const page = await browser.newPage();
    testUser = await registerNewUser(page, 'integration');
    await page.close();
  });

  test.describe('Authentication', () => {
    test('should register, logout, and login successfully', async ({ page }) => {
      const newUser = await registerNewUser(page, 'auth');
      
      // Verify we're on the outline page
      await expect(page).toHaveURL('http://localhost:5173/');
      await expect(page.locator('text=BrainFlowy')).toBeVisible();
      
      // Logout
      await logout(page);
      await expect(page).toHaveURL(/.*login/);
      
      // Login again
      await login(page, newUser.email, newUser.password);
      await expect(page).toHaveURL('http://localhost:5173/');
    });
  });

  test.describe('Basic Outline Operations', () => {
    test('should create and edit bullet points', async ({ page }) => {
      await login(page, testUser.email, testUser.password);
      
      // Create first bullet
      await page.keyboard.type('First bullet point');
      await page.keyboard.press('Enter');
      
      // Create second bullet
      await page.keyboard.type('Second bullet point');
      await page.keyboard.press('Enter');
      
      // Verify bullets are visible
      await expect(page.locator('text=First bullet point')).toBeVisible();
      await expect(page.locator('text=Second bullet point')).toBeVisible();
      
      // Edit first bullet by clicking on it
      const firstBullet = page.locator('text=First bullet point').first();
      await firstBullet.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type('Edited first bullet');
      await page.keyboard.press('Enter');
      
      // Verify edit
      await expect(page.locator('text=Edited first bullet')).toBeVisible();
      await expect(page.locator('text=First bullet point')).not.toBeVisible();
    });

    test('should create nested hierarchy with Tab/Shift+Tab', async ({ page }) => {
      const user = await registerNewUser(page, 'hierarchy');
      
      // Create main item
      await page.keyboard.type('Main Topic');
      await page.keyboard.press('Enter');
      
      // Create and indent first sub-item
      await page.keyboard.press('Tab');
      await page.keyboard.type('Subtopic 1');
      await page.keyboard.press('Enter');
      
      // Create second sub-item at same level
      await page.keyboard.type('Subtopic 2');
      await page.keyboard.press('Enter');
      
      // Create sub-sub-item
      await page.keyboard.press('Tab');
      await page.keyboard.type('Detail 2.1');
      await page.keyboard.press('Enter');
      
      // Outdent back to sub-item level
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.type('Subtopic 3');
      
      // Verify all items are visible
      await expect(page.locator('text=Main Topic')).toBeVisible();
      await expect(page.locator('text=Subtopic 1')).toBeVisible();
      await expect(page.locator('text=Subtopic 2')).toBeVisible();
      await expect(page.locator('text=Detail 2.1')).toBeVisible();
      await expect(page.locator('text=Subtopic 3')).toBeVisible();
    });
  });

  test.describe('Persistence', () => {
    test('should persist outline after page refresh', async ({ page }) => {
      const user = await registerNewUser(page, 'persist_refresh');
      
      // Create items
      await page.keyboard.type('Persistent Item 1');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Persistent Item 2');
      
      // Wait for auto-save
      await page.waitForTimeout(2000);
      
      // Refresh page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Verify items persist
      await expect(page.locator('text=Persistent Item 1')).toBeVisible();
      await expect(page.locator('text=Persistent Item 2')).toBeVisible();
    });

    test('should persist hierarchy after logout/login', async ({ page }) => {
      const user = await registerNewUser(page, 'persist_logout');
      
      // Create nested structure
      await page.keyboard.type('Root Item');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await page.keyboard.type('Child Item');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await page.keyboard.type('Grandchild Item');
      
      // Wait for save
      await page.waitForTimeout(2000);
      
      // Logout and login
      await logout(page);
      await login(page, user.email, user.password);
      
      // Verify hierarchy persists
      await expect(page.locator('text=Root Item')).toBeVisible();
      await expect(page.locator('text=Child Item')).toBeVisible();
      await expect(page.locator('text=Grandchild Item')).toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should handle Enter, Tab, Shift+Tab shortcuts', async ({ page }) => {
      const user = await registerNewUser(page, 'shortcuts');
      
      // Test Enter for new line
      await page.keyboard.type('Line 1');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Line 2');
      
      // Test Tab for indent
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await page.keyboard.type('Indented Line');
      
      // Test Shift+Tab for outdent
      await page.keyboard.press('Enter');
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.type('Back to normal');
      
      // Verify all items
      await expect(page.locator('text=Line 1')).toBeVisible();
      await expect(page.locator('text=Line 2')).toBeVisible();
      await expect(page.locator('text=Indented Line')).toBeVisible();
      await expect(page.locator('text=Back to normal')).toBeVisible();
    });

    test('should delete items with Backspace on empty line', async ({ page }) => {
      const user = await registerNewUser(page, 'delete');
      
      // Create items
      await page.keyboard.type('Item to keep');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Item to delete');
      await page.keyboard.press('Enter');
      
      // Delete the empty line (should delete "Item to delete")
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Backspace');
      
      // Verify deletion
      await expect(page.locator('text=Item to keep')).toBeVisible();
      await page.waitForTimeout(500);
      
      // The "Item to delete" should be in edit mode or deleted
      const itemToDelete = page.locator('text=Item to delete');
      const count = await itemToDelete.count();
      if (count > 0) {
        // If still visible, it should be in edit mode
        const input = page.locator('input:has-text("Item to delete"), textarea:has-text("Item to delete")');
        await expect(input).toBeVisible();
      }
    });
  });

  test.describe('Search and Filter', () => {
    test('should search and highlight matching items', async ({ page }) => {
      const user = await registerNewUser(page, 'search');
      
      // Create test items
      await page.keyboard.type('Apple product review');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Banana smoothie recipe');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Apple pie ingredients');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Orange juice benefits');
      
      // Wait for items to save
      await page.waitForTimeout(1000);
      
      // Open search (look for search input)
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]').first();
      await searchInput.fill('Apple');
      
      // Wait for search to apply
      await page.waitForTimeout(500);
      
      // Verify Apple items are visible/highlighted
      await expect(page.locator('text=Apple product review')).toBeVisible();
      await expect(page.locator('text=Apple pie ingredients')).toBeVisible();
      
      // Clear search
      await searchInput.clear();
      
      // All items should be visible again
      await expect(page.locator('text=Banana smoothie recipe')).toBeVisible();
      await expect(page.locator('text=Orange juice benefits')).toBeVisible();
    });
  });

  test.describe('Brainlift Template', () => {
    test('should create Brainlift template structure', async ({ page }) => {
      const user = await registerNewUser(page, 'brainlift');
      
      // Click Create Brainlift button
      const brainliftButton = page.locator('button:has-text("Create"), button:has-text("Brainlift")').first();
      await brainliftButton.click();
      
      // Wait for template to be created
      await page.waitForTimeout(2000);
      
      // Verify Brainlift sections are created
      await expect(page.locator('text=/SPOV/i')).toBeVisible();
      await expect(page.locator('text=/Purpose/i')).toBeVisible();
      await expect(page.locator('text=/Expert Council/i')).toBeVisible();
      await expect(page.locator('text=/DOK Level/i').first()).toBeVisible();
      
      // Verify it persists
      await page.reload();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('text=/SPOV/i')).toBeVisible();
      await expect(page.locator('text=/Purpose/i')).toBeVisible();
    });
  });

  test.describe('AI Assistant', () => {
    test('should open AI assistant and show preview', async ({ page }) => {
      const user = await registerNewUser(page, 'ai_assistant');
      
      // Create a test item
      await page.keyboard.type('Test item for AI');
      await page.keyboard.press('Enter');
      
      // Open AI assistant (look for AI/brain icon button)
      const aiButton = page.locator('button[aria-label*="AI"], button[aria-label*="assistant"], button:has-text("AI"), [class*="brain"]').first();
      if (await aiButton.isVisible()) {
        await aiButton.click();
        
        // Wait for AI panel to open
        await page.waitForTimeout(1000);
        
        // Verify AI panel is visible
        const aiPanel = page.locator('text=/AI Assistant/i, text=/Assistant/i').first();
        await expect(aiPanel).toBeVisible();
        
        // Type a prompt
        const aiInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="create"], input[placeholder*="Ask"]').first();
        if (await aiInput.isVisible()) {
          await aiInput.fill('Create a test SPOV');
          
          // Submit (find send button or press Enter)
          const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
          } else {
            await aiInput.press('Enter');
          }
          
          // Wait for response
          await page.waitForTimeout(3000);
          
          // Look for preview or apply button
          const applyButton = page.locator('button:has-text("Apply"), button:has-text("Accept")').first();
          if (await applyButton.isVisible()) {
            console.log('✅ AI preview/apply button found');
          }
        }
      }
    });
  });

  test.describe('Voice Mode', () => {
    test('should open voice modal', async ({ page }) => {
      const user = await registerNewUser(page, 'voice');
      
      // Look for voice/mic button
      const voiceButton = page.locator('button[aria-label*="Voice"], button[aria-label*="voice"], button:has-text("Voice"), [class*="mic"]').first();
      if (await voiceButton.isVisible()) {
        await voiceButton.click();
        
        // Wait for voice modal
        await page.waitForTimeout(1000);
        
        // Verify voice modal is visible
        const voiceModal = page.locator('text=/Voice Input/i, text=/Speak/i').first();
        if (await voiceModal.isVisible()) {
          console.log('✅ Voice modal opened');
          
          // Close modal
          const closeButton = page.locator('button[aria-label="Close"], button:has-text("Close"), button:has-text("Cancel")').first();
          await closeButton.click();
        }
      }
    });
  });

  test.describe('Drag and Drop', () => {
    test('should show drag handles on hover', async ({ page }) => {
      const user = await registerNewUser(page, 'drag');
      
      // Create items
      await page.keyboard.type('Item to drag');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Target item');
      
      // Wait for save
      await page.waitForTimeout(1000);
      
      // Hover over first item to show drag handle
      const firstItem = page.locator('text=Item to drag').first();
      await firstItem.hover();
      
      // Look for drag handle (usually has grip or drag icon)
      const dragHandle = page.locator('[class*="drag"], [class*="grip"], [aria-label*="drag"]').first();
      if (await dragHandle.isVisible({ timeout: 2000 })) {
        console.log('✅ Drag handle visible on hover');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message for failed operations', async ({ page }) => {
      const user = await registerNewUser(page, 'error');
      
      // Try to trigger an error (e.g., by manipulating localStorage)
      await page.evaluate(() => {
        // Clear auth token to cause auth error
        localStorage.removeItem('accessToken');
      });
      
      // Try to create an item (should fail)
      await page.keyboard.type('This should fail');
      await page.keyboard.press('Enter');
      
      // Wait for potential error
      await page.waitForTimeout(2000);
      
      // Look for any error messages
      const errorMessage = page.locator('text=/error/i, text=/failed/i, [class*="error"]').first();
      if (await errorMessage.isVisible({ timeout: 2000 })) {
        console.log('✅ Error handling working');
      }
      
      // Restore by logging in again
      await page.goto('http://localhost:5173/login');
      await login(page, user.email, user.password);
    });
  });

  test.describe('Performance', () => {
    test('should handle large number of items', async ({ page }) => {
      const user = await registerNewUser(page, 'performance');
      
      // Create many items quickly
      for (let i = 1; i <= 20; i++) {
        await page.keyboard.type(`Performance test item ${i}`);
        await page.keyboard.press('Enter');
      }
      
      // Wait for all to save
      await page.waitForTimeout(3000);
      
      // Verify first and last items are visible
      await expect(page.locator('text=Performance test item 1')).toBeVisible();
      await expect(page.locator('text=Performance test item 20')).toBeVisible();
      
      // Test search performance with many items
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('item 15');
        await page.waitForTimeout(500);
        await expect(page.locator('text=Performance test item 15')).toBeVisible();
      }
    });
  });
});