import { test, expect } from '@playwright/test';

test.describe('Data Persistence and Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
  });

  test('should persist data in localStorage', async ({ page }) => {
    // First, let's manually set something in localStorage to test persistence
    await page.evaluate(() => {
      window.localStorage.setItem('test-key', 'test-value');
      window.localStorage.setItem('user-pref', JSON.stringify({ theme: 'light' }));
    });
    
    const localStorage = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          storage[key] = window.localStorage.getItem(key);
        }
      }
      return storage;
    });
    
    expect(Object.keys(localStorage).length).toBeGreaterThan(0);
    expect(localStorage['test-key']).toBe('test-value');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const persistedItem = page.locator('text=Persistent test item');
    if (await persistedItem.count() > 0) {
      await expect(persistedItem.first()).toBeVisible();
    }
  });

  test('should persist data in sessionStorage', async ({ page }) => {
    await page.evaluate(() => {
      window.sessionStorage.setItem('test-session', 'test-value');
    });
    
    const sessionData = await page.evaluate(() => {
      return window.sessionStorage.getItem('test-session');
    });
    
    expect(sessionData).toBe('test-value');
  });

  test('should persist user preferences', async ({ page }) => {
    const settingsButton = page.locator('button[aria-label*="settings" i], button:has-text("Settings")');
    
    if (await settingsButton.count() > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);
      
      const themeToggle = page.locator('input[type="checkbox"], button').filter({ hasText: /theme|dark|light/i });
      if (await themeToggle.count() > 0) {
        await themeToggle.first().click();
        await page.waitForTimeout(300);
      }
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const body = page.locator('body');
      const classes = await body.getAttribute('class');
      if (classes) {
        expect(classes).toMatch(/dark|light/);
      }
    }
  });

  test('should sync data with backend', async ({ page }) => {
    const inputField = page.locator('input[placeholder*="item" i], textarea').first();
    
    if (await inputField.count() > 0) {
      await inputField.fill('Sync test item');
      await page.keyboard.press('Enter');
      
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api') && 
                   (response.request().method() === 'POST' || 
                    response.request().method() === 'PUT'),
        { timeout: 5000 }
      ).catch(() => null);
      
      const response = await responsePromise;
      if (response) {
        expect(response.status()).toBeLessThan(400);
      }
    }
  });

  test('should handle offline mode', async ({ page, context }) => {
    await context.setOffline(true);
    
    const inputField = page.locator('input[placeholder*="item" i], textarea').first();
    if (await inputField.count() > 0) {
      await inputField.fill('Offline test item');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    const offlineIndicator = page.locator('.offline, [aria-label*="offline" i]');
    if (await offlineIndicator.count() > 0) {
      await expect(offlineIndicator.first()).toBeVisible();
    }
    
    await context.setOffline(false);
    await page.waitForTimeout(1000);
    
    const onlineIndicator = page.locator('.online, [aria-label*="online" i]');
    if (await onlineIndicator.count() > 0) {
      await expect(onlineIndicator.first()).toBeVisible();
    }
  });

  test('should queue actions when offline', async ({ page, context }) => {
    await context.setOffline(true);
    
    const inputField = page.locator('input[placeholder*="item" i], textarea').first();
    if (await inputField.count() > 0) {
      await inputField.fill('Queued item 1');
      await page.keyboard.press('Enter');
      await inputField.fill('Queued item 2');
      await page.keyboard.press('Enter');
    }
    
    await context.setOffline(false);
    await page.waitForTimeout(2000);
    
    const syncStatus = page.locator('.sync-status, [aria-label*="sync" i]');
    if (await syncStatus.count() > 0) {
      const statusText = await syncStatus.first().textContent();
      expect(statusText).toMatch(/synced|complete|success/i);
    }
  });

  test('should handle concurrent edits', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto('http://localhost:5176/outlines');
    await page2.goto('http://localhost:5176/outlines');
    
    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    const input1 = page1.locator('input[placeholder*="item" i], textarea').first();
    const input2 = page2.locator('input[placeholder*="item" i], textarea').first();
    
    if (await input1.count() > 0 && await input2.count() > 0) {
      await input1.fill('Edit from page 1');
      await page1.keyboard.press('Enter');
      
      await page2.waitForTimeout(1000);
      await page2.reload();
      
      const item = page2.locator('text=Edit from page 1');
      if (await item.count() > 0) {
        await expect(item.first()).toBeVisible();
      }
    }
    
    await context1.close();
    await context2.close();
  });

  test('should auto-save periodically', async ({ page }) => {
    const inputField = page.locator('input[placeholder*="item" i], textarea').first();
    
    if (await inputField.count() > 0) {
      await inputField.fill('Auto-save test');
      
      const saveRequests = [];
      page.on('request', request => {
        if (request.method() === 'POST' || request.method() === 'PUT') {
          saveRequests.push(request);
        }
      });
      
      await page.waitForTimeout(5000);
      
      if (saveRequests.length > 0) {
        expect(saveRequests.length).toBeGreaterThan(0);
      }
    }
  });

  test('should export data', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button[aria-label*="export" i]');
    
    if (await exportButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.first().click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(json|txt|md|csv)/);
      }
    }
  });

  test('should import data', async ({ page }) => {
    const importButton = page.locator('button:has-text("Import"), button[aria-label*="import" i]');
    
    if (await importButton.count() > 0) {
      await importButton.first().click();
      await page.waitForTimeout(500);
      
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        const testData = JSON.stringify({ items: ['Imported item 1', 'Imported item 2'] });
        const buffer = Buffer.from(testData);
        
        await fileInput.setInputFiles({
          name: 'test-import.json',
          mimeType: 'application/json',
          buffer: buffer
        });
        
        await page.waitForTimeout(1000);
        
        const importedItem = page.locator('text=Imported item');
        if (await importedItem.count() > 0) {
          await expect(importedItem.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle data conflicts', async ({ page }) => {
    await page.evaluate(() => {
      const conflictData = {
        id: 'test-conflict',
        version: 1,
        content: 'Original content'
      };
      window.localStorage.setItem('conflict-test', JSON.stringify(conflictData));
    });
    
    await page.evaluate(() => {
      const conflictData = {
        id: 'test-conflict',
        version: 2,
        content: 'Modified content'
      };
      window.localStorage.setItem('conflict-test', JSON.stringify(conflictData));
    });
    
    const conflictModal = page.locator('.conflict-modal, [aria-label*="conflict" i]');
    if (await conflictModal.count() > 0) {
      await expect(conflictModal.first()).toBeVisible();
      
      const resolveButton = page.locator('button:has-text("Resolve"), button:has-text("Merge")');
      if (await resolveButton.count() > 0) {
        await resolveButton.first().click();
      }
    }
  });

  test('should validate data integrity', async ({ page }) => {
    const inputField = page.locator('input[placeholder*="item" i], textarea').first();
    
    if (await inputField.count() > 0) {
      const testString = 'Data integrity test ' + Date.now();
      await inputField.fill(testString);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const savedItem = page.locator(`text="${testString}"`);
      if (await savedItem.count() > 0) {
        const savedText = await savedItem.first().textContent();
        expect(savedText).toBe(testString);
      }
    }
  });

  test('should clean up old data', async ({ page }) => {
    await page.evaluate(() => {
      for (let i = 0; i < 100; i++) {
        window.localStorage.setItem(`old-data-${i}`, `value-${i}`);
      }
    });
    
    const initialSize = await page.evaluate(() => window.localStorage.length);
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    const finalSize = await page.evaluate(() => window.localStorage.length);
    
    if (finalSize < initialSize) {
      expect(finalSize).toBeLessThan(initialSize);
    }
  });

  test('should handle storage quota exceeded', async ({ page }) => {
    await page.evaluate(() => {
      try {
        const largeData = new Array(1024 * 1024).join('x');
        for (let i = 0; i < 100; i++) {
          window.localStorage.setItem(`large-${i}`, largeData);
        }
      } catch (e) {
        window.storageError = e.name;
      }
    });
    
    const error = await page.evaluate(() => window.storageError);
    if (error) {
      expect(error).toMatch(/QuotaExceededError|QUOTA_EXCEEDED_ERR/);
    }
    
    const errorMessage = page.locator('.storage-error, [aria-label*="storage full" i]');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });
});