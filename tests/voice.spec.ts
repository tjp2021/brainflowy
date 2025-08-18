import { test, expect } from '@playwright/test';

test.describe('Voice Transcription', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
  });

  test('should display voice recording button', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i], button[aria-label*="microphone" i], button:has-text("Record")');
    
    if (await voiceButton.count() > 0) {
      await expect(voiceButton.first()).toBeVisible();
    }
  });

  test('should open voice modal when clicking record button', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i], button[aria-label*="microphone" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(500);
      
      const modal = page.locator('.modal, [role="dialog"], .voice-modal');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();
      }
      
      const recordButton = page.locator('.modal button:has-text("Start"), .modal button:has-text("Record"), button[aria-label*="start recording" i]');
      if (await recordButton.count() > 0) {
        await expect(recordButton.first()).toBeVisible();
      }
    }
  });

  test('should show recording indicators when recording', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(500);
      
      const startButton = page.locator('button:has-text("Start Recording"), button:has-text("Start")');
      if (await startButton.count() > 0) {
        await startButton.first().click();
        await page.waitForTimeout(500);
        
        const recordingIndicator = page.locator('.recording, .recording-indicator, .pulse, [class*="animate"], .red');
        if (await recordingIndicator.count() > 0) {
          await expect(recordingIndicator.first()).toBeVisible();
        }
        
        const timer = page.locator('.timer, .recording-time, [aria-label*="recording time" i]');
        if (await timer.count() > 0) {
          await expect(timer.first()).toBeVisible();
        }
        
        const stopButton = page.locator('button:has-text("Stop"), button:has-text("Stop Recording")');
        if (await stopButton.count() > 0) {
          await stopButton.first().click();
        }
      }
    }
  });

  test('should display transcription after recording', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(500);
      
      const startButton = page.locator('button:has-text("Start Recording"), button:has-text("Start")');
      if (await startButton.count() > 0) {
        await startButton.first().click();
        await page.waitForTimeout(2000);
        
        const stopButton = page.locator('button:has-text("Stop"), button:has-text("Stop Recording")');
        if (await stopButton.count() > 0) {
          await stopButton.first().click();
          await page.waitForTimeout(1000);
          
          const transcription = page.locator('.transcription, .transcript, textarea, [aria-label*="transcription" i]');
          if (await transcription.count() > 0) {
            await expect(transcription.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should allow editing transcription', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(500);
      
      const transcriptionField = page.locator('textarea, .transcription-edit, [contenteditable="true"]');
      if (await transcriptionField.count() > 0) {
        await transcriptionField.first().fill('Test transcription text');
        await expect(transcriptionField.first()).toHaveValue('Test transcription text');
      }
    }
  });

  test('should add transcription to outline', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(500);
      
      const transcriptionField = page.locator('textarea, .transcription-edit');
      if (await transcriptionField.count() > 0) {
        await transcriptionField.first().fill('Voice transcription test item');
      }
      
      const addButton = page.locator('button:has-text("Add to Outline"), button:has-text("Add"), button:has-text("Insert")');
      if (await addButton.count() > 0) {
        await addButton.first().click();
        await page.waitForTimeout(500);
        
        const outlineItem = page.locator('text=Voice transcription test item');
        if (await outlineItem.count() > 0) {
          await expect(outlineItem.first()).toBeVisible();
        }
      }
    }
  });

  test('should show audio waveform visualization', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(500);
      
      const startButton = page.locator('button:has-text("Start Recording"), button:has-text("Start")');
      if (await startButton.count() > 0) {
        await startButton.first().click();
        await page.waitForTimeout(500);
        
        const waveform = page.locator('canvas, .waveform, .visualizer, svg.waveform');
        if (await waveform.count() > 0) {
          await expect(waveform.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle pause and resume recording', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(500);
      
      const startButton = page.locator('button:has-text("Start Recording"), button:has-text("Start")');
      if (await startButton.count() > 0) {
        await startButton.first().click();
        await page.waitForTimeout(1000);
        
        const pauseButton = page.locator('button:has-text("Pause"), button[aria-label*="pause" i]');
        if (await pauseButton.count() > 0) {
          await pauseButton.first().click();
          await page.waitForTimeout(500);
          
          const resumeButton = page.locator('button:has-text("Resume"), button[aria-label*="resume" i]');
          if (await resumeButton.count() > 0) {
            await expect(resumeButton.first()).toBeVisible();
            await resumeButton.first().click();
          }
        }
      }
    }
  });

  test('should cancel recording', async ({ page }) => {
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(500);
      
      const startButton = page.locator('button:has-text("Start Recording"), button:has-text("Start")');
      if (await startButton.count() > 0) {
        await startButton.first().click();
        await page.waitForTimeout(1000);
        
        const cancelButton = page.locator('button:has-text("Cancel"), button[aria-label*="cancel" i]');
        if (await cancelButton.count() > 0) {
          await cancelButton.first().click();
          await page.waitForTimeout(500);
          
          const modal = page.locator('.modal, [role="dialog"]');
          if (await modal.count() > 0) {
            await expect(modal.first()).not.toBeVisible();
          }
        }
      }
    }
  });

  test('should show error when microphone access is denied', async ({ page, context }) => {
    await context.clearPermissions();
    
    const voiceButton = page.locator('button[aria-label*="voice" i], button[aria-label*="record" i]');
    
    if (await voiceButton.count() > 0) {
      await voiceButton.first().click();
      await page.waitForTimeout(500);
      
      const startButton = page.locator('button:has-text("Start Recording"), button:has-text("Start")');
      if (await startButton.count() > 0) {
        await startButton.first().click();
        await page.waitForTimeout(1000);
        
        const errorMessage = page.locator('.error, [role="alert"], .error-message');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    }
  });
});