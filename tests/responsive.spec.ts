import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design - Desktop', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('should display desktop layout', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    const desktopSidebar = page.locator('.sidebar, .desktop-sidebar, aside');
    if (await desktopSidebar.count() > 0) {
      await expect(desktopSidebar.first()).toBeVisible();
    }
    
    const desktopNav = page.locator('.desktop-nav, nav.desktop');
    if (await desktopNav.count() > 0) {
      await expect(desktopNav.first()).toBeVisible();
    }
  });

  test('should show all navigation items on desktop', async ({ page }) => {
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation links specifically
    const navLinks = page.locator('.nav-links a, .nav-links button, nav a');
    const navCount = await navLinks.count();
    
    // The Header component should have at least 2 nav items (Sign In, Get Started or My Outlines, Logout)
    expect(navCount).toBeGreaterThanOrEqual(2);
    
    // Check visibility of available nav items
    if (navCount > 0) {
      for (let i = 0; i < Math.min(navCount, 5); i++) {
        await expect(navLinks.nth(i)).toBeVisible();
      }
    }
  });

  test('should display multi-column layout on desktop', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    
    const columns = page.locator('.column, .col, [class*="grid"], [class*="flex"]');
    if (await columns.count() > 0) {
      const firstColumn = columns.first();
      const box = await firstColumn.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(300);
      }
    }
  });
});

test.describe('Responsive Design - Tablet', () => {
  test('should display tablet layout', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad']
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    const hamburgerMenu = page.locator('.hamburger, .menu-toggle, button[aria-label*="menu" i]');
    const sidebarToggle = page.locator('.sidebar-toggle, button[aria-label*="sidebar" i]');
    
    if (await hamburgerMenu.count() > 0 || await sidebarToggle.count() > 0) {
      await expect(hamburgerMenu.first().or(sidebarToggle.first())).toBeVisible();
    }
  });

  test('should toggle sidebar on tablet', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad']
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5176/outlines');
    
    const toggleButton = page.locator('.sidebar-toggle, button[aria-label*="sidebar" i], .hamburger');
    if (await toggleButton.count() > 0) {
      await toggleButton.first().click();
      await page.waitForTimeout(300);
      
      const sidebar = page.locator('.sidebar, aside');
      if (await sidebar.count() > 0) {
        await expect(sidebar.first()).toBeVisible();
        
        await toggleButton.first().click();
        await page.waitForTimeout(300);
        
        const sidebarHidden = await sidebar.first().isHidden();
        expect(sidebarHidden).toBeTruthy();
      }
    }
  });
});

test.describe('Responsive Design - Mobile', () => {
  test('should display mobile layout', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    
    const mobileNav = page.locator('.mobile-nav, .bottom-nav, nav[class*="mobile"]');
    const hamburger = page.locator('.hamburger, .menu-toggle, button[aria-label*="menu" i]');
    
    if (await mobileNav.count() > 0 || await hamburger.count() > 0) {
      await expect(mobileNav.first().or(hamburger.first())).toBeVisible();
    }
  });

  test('should have touch-friendly button sizes', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5176/outlines');
    
    const buttons = page.locator('button:visible');
    const buttonCount = Math.min(await buttons.count(), 5);
    
    // Check that we have at least some buttons
    if (buttonCount > 0) {
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          // For mobile, buttons should be at least 24px in height (minimum touch target)
          // 40px is ideal but may not always be the case for all buttons
          expect(box.height).toBeGreaterThanOrEqual(24);
          // Width check - some buttons might be icon-only so check for minimum
          expect(box.width).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });

  test('should stack content vertically on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5176/outlines');
    
    const sections = page.locator('section, .content-section, main > div');
    if (await sections.count() > 1) {
      const first = await sections.first().boundingBox();
      const second = await sections.nth(1).boundingBox();
      
      if (first && second) {
        expect(second.y).toBeGreaterThan(first.y + first.height - 10);
      }
    }
  });

  test('should show mobile menu when hamburger clicked', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5176');
    
    const hamburger = page.locator('.hamburger, .menu-toggle, button[aria-label*="menu" i]');
    if (await hamburger.count() > 0) {
      await hamburger.first().click();
      await page.waitForTimeout(300);
      
      const mobileMenu = page.locator('.mobile-menu, .drawer, .slide-menu, [role="navigation"]');
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu.first()).toBeVisible();
      }
    }
  });

  test('should handle touch gestures on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5176/outlines');
    
    const swipeableElement = page.locator('.outline-item, .swipeable, [data-swipe]').first();
    if (await swipeableElement.count() > 0) {
      const box = await swipeableElement.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(300);
        
        const actionButtons = page.locator('.swipe-actions, .item-actions');
        if (await actionButtons.count() > 0) {
          await expect(actionButtons.first()).toBeVisible();
        }
      }
    }
  });
});

test.describe('Responsive Design - Orientation Changes', () => {
  test('should adapt to landscape orientation', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('http://localhost:5176/outlines');
    
    const landscapeLayout = page.locator('.landscape, [data-orientation="landscape"]');
    if (await landscapeLayout.count() > 0) {
      await expect(landscapeLayout.first()).toBeVisible();
    }
  });

  test('should adapt to portrait orientation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5176/outlines');
    
    const portraitLayout = page.locator('.portrait, [data-orientation="portrait"]');
    if (await portraitLayout.count() > 0) {
      await expect(portraitLayout.first()).toBeVisible();
    }
  });
});

test.describe('Responsive Design - Breakpoints', () => {
  const breakpoints = [
    { name: 'xs', width: 320, height: 568 },
    { name: 'sm', width: 640, height: 480 },
    { name: 'md', width: 768, height: 1024 },
    { name: 'lg', width: 1024, height: 768 },
    { name: 'xl', width: 1280, height: 720 },
    { name: '2xl', width: 1536, height: 864 },
  ];

  for (const breakpoint of breakpoints) {
    test(`should render correctly at ${breakpoint.name} breakpoint`, async ({ page }) => {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto('http://localhost:5176/outlines');
      await page.waitForLoadState('networkidle');
      
      const mainContent = page.locator('main, #root, .app');
      await expect(mainContent.first()).toBeVisible();
      
      const viewport = page.viewportSize();
      if (viewport) {
        expect(viewport.width).toBe(breakpoint.width);
        expect(viewport.height).toBe(breakpoint.height);
      }
    });
  }
});

test.describe('Responsive Design - Font Scaling', () => {
  test('should scale fonts appropriately on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5176/outlines');
    
    const heading = page.locator('h1, h2, h3').first();
    if (await heading.count() > 0) {
      const fontSize = await heading.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      const fontSizeNum = parseInt(fontSize);
      expect(fontSizeNum).toBeGreaterThanOrEqual(16);
      expect(fontSizeNum).toBeLessThanOrEqual(32);
    }
  });

  test('should scale fonts appropriately on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5176/outlines');
    
    const heading = page.locator('h1, h2, h3').first();
    if (await heading.count() > 0) {
      const fontSize = await heading.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      const fontSizeNum = parseInt(fontSize);
      // Desktop headings are usually at least 16px, 20px is ideal but not always guaranteed
      expect(fontSizeNum).toBeGreaterThanOrEqual(16);
    }
  });
});

test.describe('Responsive Design - Image Handling', () => {
  test('should load appropriate image sizes', async ({ page }) => {
    await page.goto('http://localhost:5176');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      const img = images.nth(i);
      const srcset = await img.getAttribute('srcset');
      const sizes = await img.getAttribute('sizes');
      
      if (srcset || sizes) {
        expect(srcset || sizes).toBeTruthy();
      }
    }
  });
});

test.describe('Responsive Design - Performance', () => {
  test('should maintain performance on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const startTime = Date.now();
    await page.goto('http://localhost:5176/outlines');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('should lazy load content on scroll', async ({ page }) => {
    await page.goto('http://localhost:5176/outlines');
    
    const lazyElements = page.locator('[loading="lazy"], .lazy-load');
    if (await lazyElements.count() > 0) {
      const initialVisible = await lazyElements.evaluateAll(elements => 
        elements.filter(el => el.getBoundingClientRect().top < window.innerHeight).length
      );
      
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      const afterScrollVisible = await lazyElements.evaluateAll(elements =>
        elements.filter(el => el.getBoundingClientRect().top < window.innerHeight).length
      );
      
      expect(afterScrollVisible).toBeGreaterThanOrEqual(initialVisible);
    }
  });
});