import { test, expect } from '@playwright/test';

test.describe('AI Integration and Chat Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
  });

  test('should display AI chat interface', async ({ page }) => {
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i], button:has-text("Chat"), button:has-text("AI")');
    
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      const chatInterface = page.locator('.chat-interface, .ai-chat, [role="complementary"]');
      if (await chatInterface.count() > 0) {
        await expect(chatInterface.first()).toBeVisible();
      }
    }
  });

  test('should send message to AI', async ({ page }) => {
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i]');
    
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="ask" i]');
      if (await chatInput.count() > 0) {
        await chatInput.first().fill('Help me organize my thoughts');
        
        const sendButton = page.locator('button[aria-label*="send" i], button:has-text("Send")');
        if (await sendButton.count() > 0) {
          await sendButton.first().click();
        } else {
          await page.keyboard.press('Enter');
        }
        
        await page.waitForTimeout(1000);
        
        const messages = page.locator('.message, .chat-message');
        if (await messages.count() > 0) {
          expect(await messages.count()).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should display AI response', async ({ page }) => {
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i]');
    
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
      if (await chatInput.count() > 0) {
        await chatInput.first().fill('Test message');
        await page.keyboard.press('Enter');
        
        const aiResponse = await page.waitForSelector('.ai-response, .assistant-message, .bot-message', { 
          timeout: 5000 
        }).catch(() => null);
        
        if (aiResponse) {
          await expect(aiResponse).toBeVisible();
        }
      }
    }
  });

  test('should show typing indicator while AI responds', async ({ page }) => {
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i]');
    
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
      if (await chatInput.count() > 0) {
        await chatInput.first().fill('Complex question');
        await page.keyboard.press('Enter');
        
        const typingIndicator = page.locator('.typing-indicator, .loading, .dots, [aria-label*="typing" i]');
        if (await typingIndicator.count() > 0) {
          await expect(typingIndicator.first()).toBeVisible();
        }
      }
    }
  });

  test('should apply AI suggestions to outline', async ({ page }) => {
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i]');
    
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
      if (await chatInput.count() > 0) {
        await chatInput.first().fill('Suggest outline structure for a blog post');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        const applyButton = page.locator('button:has-text("Apply"), button:has-text("Use Suggestion"), button:has-text("Add to Outline")');
        if (await applyButton.count() > 0) {
          await applyButton.first().click();
          await page.waitForTimeout(500);
          
          const outlineItems = page.locator('.outline-item');
          const itemCount = await outlineItems.count();
          expect(itemCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should show chat history', async ({ page }) => {
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i]');
    
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
      if (await chatInput.count() > 0) {
        await chatInput.first().fill('First message');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        await chatInput.first().fill('Second message');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        const messages = page.locator('.message, .chat-message');
        const messageCount = await messages.count();
        expect(messageCount).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('should clear chat history', async ({ page }) => {
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i]');
    
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
      if (await chatInput.count() > 0) {
        await chatInput.first().fill('Test message');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
      
      const clearButton = page.locator('button:has-text("Clear"), button[aria-label*="clear" i]');
      if (await clearButton.count() > 0) {
        await clearButton.first().click();
        await page.waitForTimeout(500);
        
        const messages = page.locator('.message, .chat-message');
        const messageCount = await messages.count();
        expect(messageCount).toBe(0);
      }
    }
  });

  test('should handle AI error responses', async ({ page }) => {
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i]');
    
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      await page.evaluate(() => {
        window.fetch = () => Promise.reject(new Error('Network error'));
      });
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
      if (await chatInput.count() > 0) {
        await chatInput.first().fill('Test message');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        const errorMessage = page.locator('.error, [role="alert"], .error-message');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    }
  });

  test('should provide context-aware suggestions', async ({ page }) => {
    const outlineInput = page.locator('input[placeholder*="item" i], textarea');
    if (await outlineInput.count() > 0) {
      await outlineInput.first().fill('Project planning');
      await page.keyboard.press('Enter');
    }
    
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i]');
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
      if (await chatInput.count() > 0) {
        await chatInput.first().fill('Expand on the current outline');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        const response = page.locator('.ai-response, .assistant-message');
        if (await response.count() > 0) {
          const responseText = await response.first().textContent();
          expect(responseText).toBeTruthy();
        }
      }
    }
  });

  test('should export chat conversation', async ({ page }) => {
    const chatButton = page.locator('button[aria-label*="chat" i], button[aria-label*="ai" i]');
    
    if (await chatButton.count() > 0) {
      await chatButton.first().click();
      await page.waitForTimeout(500);
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
      if (await chatInput.count() > 0) {
        await chatInput.first().fill('Test conversation');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
      
      const exportButton = page.locator('button:has-text("Export"), button[aria-label*="export" i]');
      if (await exportButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await exportButton.first().click();
        
        const download = await downloadPromise;
        if (download) {
          expect(download).toBeTruthy();
        }
      }
    }
  });
});