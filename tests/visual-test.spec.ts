import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Vacation Guide Visual Tests', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    // Slow down actions so you can see what's happening
    actionTimeout: 3000,
  });

  test('should navigate through Dutch (NL) pages', async ({ page }) => {
    // Go to Dutch homepage
    await page.goto(`${BASE_URL}/nl`);
    await expect(page).toHaveTitle(/Vakantiegids/i);

    console.log('✓ Testing NL Homepage...');
    await page.waitForTimeout(2000); // Pause so you can see it

    // Check for hero section
    await expect(page.locator('h1')).toContainText('Andalusië');

    // Test navigation - Itinerary
    console.log('✓ Clicking Dagplanning (Itinerary)...');
    await page.click('text=Dagplanning');
    await page.waitForURL('**/nl/itinerary');
    await expect(page.locator('h1')).toContainText('Dagplanning');
    await page.waitForTimeout(1500);

    // Test navigation - Attractions
    console.log('✓ Clicking Bezienswaardigheden (Attractions)...');
    await page.click('text=Bezienswaardigheden');
    await page.waitForURL('**/nl/attractions');
    await expect(page.locator('h1')).toContainText('Bezienswaardigheden');
    await page.waitForTimeout(1500);

    // Test navigation - Map
    console.log('✓ Clicking Kaart (Map)...');
    await page.click('text=Kaart');
    await page.waitForURL('**/nl/map');
    await expect(page.locator('h1')).toContainText('Kaart');
    await page.waitForTimeout(1500);

    // Test navigation - Restaurants
    console.log('✓ Clicking Restaurants...');
    await page.click('text=Restaurants');
    await page.waitForURL('**/nl/restaurants');
    await expect(page.locator('h1')).toContainText('Restaurants');
    await page.waitForTimeout(1500);

    // Test navigation - Budget
    console.log('✓ Clicking Budget...');
    await page.click('text=Budget');
    await page.waitForURL('**/nl/budget');
    await expect(page.locator('h1')).toContainText('Budget');
    await page.waitForTimeout(1500);

    console.log('✅ All NL pages passed!');
  });

  test('should switch between languages', async ({ page }) => {
    // Start on Dutch homepage
    await page.goto(`${BASE_URL}/nl`);

    console.log('✓ Starting on Dutch (NL) homepage...');
    await page.waitForTimeout(2000);

    // Verify Dutch content
    await expect(page.locator('h1')).toContainText('Andalusië');

    // Click EN button
    console.log('✓ Clicking EN button to switch to English...');
    await page.click('button:has-text("EN")');
    await page.waitForURL('**/en');

    // Wait for the page to fully load with new content
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify English content
    await expect(page.locator('h1')).toContainText('Discover');
    console.log(`Current h1 text: ${await page.locator('h1').textContent()}`);
    console.log('✓ Language switched to English!');

    // Wait a bit for page to stabilize after reload
    await page.waitForTimeout(2000);

    // Switch back to Dutch
    console.log('✓ Switching back to Dutch...');
    await page.click('button:has-text("NL")');
    await page.waitForURL('**/nl');

    // Wait for page reload and content update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify we're back to Dutch
    await expect(page.locator('h1')).toContainText('Andalusië');
    console.log(`Current h1 text after switching back: ${await page.locator('h1').textContent()}`);

    console.log('✅ Language switching works correctly!');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/nl`);

    console.log('✓ Testing mobile viewport...');
    await page.waitForTimeout(2000);

    // Click hamburger menu
    console.log('✓ Opening mobile menu...');
    await page.click('button[class*="md:hidden"]'); // Mobile menu button
    await page.waitForTimeout(1500);

    // Click on a menu item - specifically in the mobile nav
    console.log('✓ Clicking menu item in mobile menu...');
    await page.locator('nav.md\\:hidden a:has-text("Dagplanning")').click();
    await page.waitForURL('**/nl/itinerary');
    await page.waitForTimeout(2000);

    console.log('✅ Mobile navigation works!');
  });

  test('should have proper HTML structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl`);

    console.log('✓ Checking HTML structure...');

    // Check for title
    await expect(page).toHaveTitle(/Andalusië Vakantiegids/);
    console.log('✓ Page title present');

    // Check for html tag with lang attribute
    const html = await page.locator('html').getAttribute('lang');
    expect(html).toBe('nl');
    console.log(`✓ HTML lang attribute: ${html}`);

    // Check for body tag
    const body = await page.locator('body').count();
    expect(body).toBe(1);
    console.log('✓ Body tag present');

    // Switch to EN and check lang changes
    await page.click('button:has-text("EN")');
    await page.waitForURL('**/en');

    const htmlEn = await page.locator('html').getAttribute('lang');
    expect(htmlEn).toBe('en');
    console.log(`✓ HTML lang attribute changed to: ${htmlEn}`);

    // Check English title
    await expect(page).toHaveTitle(/Andalusia Travel Guide/);
    console.log('✓ English title correct');

    console.log('✅ HTML structure is correct!');
  });
});
