import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Navigation & Internationalization', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 3000,
  });

  test('should navigate through Dutch (NL) pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await expect(page).toHaveTitle(/Vakantiegids/i);

    console.log('✓ Testing NL Homepage...');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1')).toContainText('Andalusië');

    console.log('✓ Clicking Planner...');
    await page.click('text=Planner');
    await page.waitForURL(`**/${TRIP_SLUG}/planner`);
    await page.waitForSelector('[role="tab"]', { timeout: 10000 });
    await page.waitForTimeout(1500);

    console.log('✓ Clicking Bezienswaardigheden (Attractions)...');
    await page.click('text=Bezienswaardigheden');
    await page.waitForURL(`**/${TRIP_SLUG}/attractions`);
    await expect(page.locator('h1')).toContainText('Bezienswaardigheden');
    await page.waitForTimeout(1500);

    console.log('✓ Clicking Restaurants...');
    await page.click('text=Restaurants');
    await page.waitForURL(`**/${TRIP_SLUG}/restaurants`);
    await expect(page.locator('h1')).toContainText('Restaurants');
    await page.waitForTimeout(1500);

    console.log('✓ Clicking Budget...');
    await page.click('text=Budget');
    await page.waitForURL(`**/${TRIP_SLUG}/budget`);
    await expect(page.locator('h1')).toContainText('Budget');
    await page.waitForTimeout(1500);

    console.log('✅ All NL pages passed!');
  });

  test('should switch between languages', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);

    console.log('✓ Starting on Dutch (NL) homepage...');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1')).toContainText('Andalusië');

    console.log('✓ Clicking EN button to switch to English...');
    await page.click('button:has-text("EN")');
    await page.waitForURL('**/en/**');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1')).toContainText('Discover');
    console.log(`Current h1 text: ${await page.locator('h1').textContent()}`);
    console.log('✓ Language switched to English!');

    await page.waitForTimeout(2000);

    console.log('✓ Switching back to Dutch...');
    await page.click('button:has-text("NL")');
    await page.waitForURL('**/nl/**');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1')).toContainText('Andalusië');
    console.log(`Current h1 text after switching back: ${await page.locator('h1').textContent()}`);

    console.log('✅ Language switching works correctly!');
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);

    console.log('✓ Testing mobile viewport...');
    await page.waitForTimeout(2000);

    console.log('✓ Opening mobile menu...');
    await page.click('button[class*="md:hidden"]');
    await page.waitForTimeout(1500);

    console.log('✓ Clicking menu item in mobile menu...');
    await page.locator('nav.md\\:hidden a:has-text("Planner")').click();
    await page.waitForURL(`**/${TRIP_SLUG}/planner`);
    await page.waitForTimeout(2000);

    console.log('✅ Mobile navigation works!');
  });

  test('should have proper HTML structure and lang attributes', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);

    console.log('✓ Checking HTML structure...');

    await expect(page).toHaveTitle(/Vakantiegids/);
    console.log('✓ Page title present');

    const html = await page.locator('html').getAttribute('lang');
    expect(html).toBe('nl');
    console.log(`✓ HTML lang attribute: ${html}`);

    const body = await page.locator('body').count();
    expect(body).toBe(1);
    console.log('✓ Body tag present');

    await page.click('button:has-text("EN")');
    await page.waitForURL('**/en/**');

    const htmlEn = await page.locator('html').getAttribute('lang');
    expect(htmlEn).toBe('en');
    console.log(`✓ HTML lang attribute changed to: ${htmlEn}`);

    await expect(page).toHaveTitle(/Travel Guide|Vacation Guide/);
    console.log('✓ English title correct');

    console.log('✅ HTML structure is correct!');
  });
});
