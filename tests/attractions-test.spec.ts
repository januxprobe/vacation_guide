import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Attractions Feature Tests', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should display attractions list with filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);

    console.log('✓ Attractions page loaded');
    await page.waitForTimeout(1500);

    // Check page title
    await expect(page.locator('h1')).toContainText('Bezienswaardigheden');

    // Check subtitle
    await expect(page.getByText('Ontdek bezienswaardigheden')).toBeVisible();

    // Check that attraction cards are displayed
    const cards = page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`);
    const count = await cards.count();
    console.log(`✓ Found ${count} attraction cards`);
    expect(count).toBeGreaterThanOrEqual(20);

    // Check counter text (e.g. "25 / 25")
    await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible();
    console.log('✓ Counter visible');

    await page.waitForTimeout(1500);

    // Test city filter - click Sevilla
    console.log('✓ Testing city filter - clicking Sevilla...');
    await page.click('button:has-text("Sevilla")');
    await page.waitForTimeout(1000);

    const sevillaCards = page.locator(`a[href*="/${TRIP_SLUG}/attractions/seville-"]`);
    const sevillaCount = await sevillaCards.count();
    console.log(`✓ Sevilla filter: ${sevillaCount} cards`);
    expect(sevillaCount).toBeGreaterThanOrEqual(8);

    // Check that Córdoba cards are NOT shown
    const cordobaCards = page.locator(`a[href*="/${TRIP_SLUG}/attractions/cordoba-"]`);
    const cordobaCount = await cordobaCards.count();
    expect(cordobaCount).toBe(0);
    console.log('✓ Córdoba cards hidden when Sevilla filter active');

    // Click "All" to reset
    await page.click('button:has-text("Alle Bezienswaardigheden")');
    await page.waitForTimeout(500);

    // Test priority filter - click Essentieel
    console.log('✓ Testing priority filter - clicking Essentieel...');
    await page.click('button:has-text("Essentieel")');
    await page.waitForTimeout(1000);

    const essentialCards = page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`);
    const essentialCount = await essentialCards.count();
    console.log(`✓ Essential filter: ${essentialCount} cards`);
    expect(essentialCount).toBeLessThan(count);
    expect(essentialCount).toBeGreaterThanOrEqual(3);

    console.log('✅ Attractions list and filters work correctly!');
  });

  test('should navigate to attraction detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1000);

    // Click on the first attraction card (Real Alcázar)
    console.log('✓ Clicking on Real Alcázar...');
    await page.click(`a[href*="/${TRIP_SLUG}/attractions/seville-real-alcazar"]`);
    await page.waitForURL(`**/${TRIP_SLUG}/attractions/seville-real-alcazar`);
    await page.waitForTimeout(1500);

    // Check the detail page
    await expect(page.locator('h1')).toContainText('Real Alcázar');
    console.log('✓ Detail page title correct');

    // Check badges are visible (use exact match to avoid matching title text)
    await expect(page.getByText('Sevilla', { exact: true })).toBeVisible();
    await expect(page.getByText('Essentieel', { exact: true })).toBeVisible();
    await expect(page.getByText('Paleis', { exact: true })).toBeVisible();
    console.log('✓ Badges visible');

    // Check pricing section
    await expect(page.getByText('Prijsinformatie')).toBeVisible();
    await expect(page.getByText('€21.00')).toBeVisible();
    console.log('✓ Pricing visible');

    // Check duration section
    await expect(page.getByText('Duur')).toBeVisible();
    console.log('✓ Duration visible');

    // Check opening hours
    await expect(page.getByText('Openingstijden')).toBeVisible();
    console.log('✓ Opening hours visible');

    // Check tips section
    await expect(page.getByText('Tips')).toBeVisible();
    console.log('✓ Tips visible');

    // Check booking required banner
    await expect(page.getByText('Reservering Vereist')).toBeVisible();
    console.log('✓ Booking required banner visible');

    // Check back link works
    console.log('✓ Clicking back link...');
    await page.click('a:has-text("Terug")');
    await page.waitForURL(`**/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1000);

    console.log('✅ Attraction detail page works correctly!');
  });

  test('should display attractions in English', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1500);

    console.log('✓ English attractions page loaded');

    // Check English title
    await expect(page.locator('h1')).toContainText('Attractions');

    // Check English subtitle
    await expect(page.getByText('Discover attractions')).toBeVisible();

    // Check English badges on cards
    await expect(page.getByText('Seville').first()).toBeVisible();
    await expect(page.getByText('Essential').first()).toBeVisible();
    console.log('✓ English badges visible');

    // Navigate to a detail page
    await page.click(`a[href*="/${TRIP_SLUG}/attractions/granada-alhambra"]`);
    await page.waitForURL(`**/${TRIP_SLUG}/attractions/granada-alhambra`);
    await page.waitForTimeout(1500);

    // Check English content
    await expect(page.locator('h1')).toContainText('Alhambra');
    await expect(page.getByText('Granada', { exact: true })).toBeVisible();
    await expect(page.getByText('Essential', { exact: true })).toBeVisible();
    await expect(page.getByText('Opening Hours')).toBeVisible();
    console.log('✓ English detail page content correct');

    console.log('✅ English attractions work correctly!');
  });

  test('should handle category filter', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1000);

    // Click on Palace category
    console.log('✓ Testing category filter - clicking Paleis...');
    await page.click('button:has-text("Paleis")');
    await page.waitForTimeout(1000);

    const palaceCards = page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`);
    const palaceCount = await palaceCards.count();
    console.log(`✓ Palace filter: ${palaceCount} cards`);
    expect(palaceCount).toBeGreaterThanOrEqual(2);

    // Click on Monument
    console.log('✓ Testing category filter - clicking Monument...');
    await page.click('button:has-text("Monument")');
    await page.waitForTimeout(1000);

    const monumentCards = page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`);
    const monumentCount = await monumentCards.count();
    console.log(`✓ Monument filter: ${monumentCount} cards`);
    expect(monumentCount).toBeGreaterThanOrEqual(1);

    console.log('✅ Category filter works correctly!');
  });
});
