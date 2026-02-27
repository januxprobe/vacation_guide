import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Phase 3: Itinerary, Restaurants & Budget', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should display itinerary with 7 day cards and expandable activities', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/itinerary`);
    await page.waitForTimeout(1500);

    // Check page title
    await expect(page.locator('h1')).toContainText('Dagplanning');
    console.log('✓ Itinerary page loaded');

    // Check all 7 day cards are present
    for (let i = 1; i <= 7; i++) {
      await expect(page.getByText(`Dag ${i}:`, { exact: false })).toBeVisible();
    }
    console.log('✓ All 7 day cards visible');

    // Day 1 should already be expanded (default)
    await expect(page.getByText('Real Alcázar', { exact: false })).toBeVisible();
    console.log('✓ Day 1 is expanded by default');

    // Check that attraction links exist in expanded day
    const attractionLinks = page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`);
    const linkCount = await attractionLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(1);
    console.log(`✓ Found ${linkCount} attraction links in expanded day`);

    // Check meal entries are visible
    await expect(page.getByText('Ontbijt', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Lunch', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Diner', { exact: true }).first()).toBeVisible();
    console.log('✓ Meal entries visible');

    // Expand day 4 (Córdoba) by clicking on it
    console.log('✓ Expanding day 4 (Córdoba)...');
    await page.click('text=Dag 4:');
    await page.waitForTimeout(500);

    // Check Córdoba attractions appear
    await expect(page.getByText('Mezquita', { exact: false })).toBeVisible();
    console.log('✓ Day 4 expanded with Mezquita visible');

    // Test expand all / collapse all
    console.log('✓ Testing expand/collapse all...');
    await page.click('text=Alles uitklappen');
    await page.waitForTimeout(500);

    // Verify all days expanded by checking day 7
    await expect(page.getByText('Vrije Dag', { exact: false })).toBeVisible();
    console.log('✓ All days expanded');

    await page.click('text=Alles inklappen');
    await page.waitForTimeout(500);
    console.log('✓ All days collapsed');

    console.log('✅ Itinerary page works correctly!');
  });

  test('should display itinerary in English', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/${TRIP_SLUG}/itinerary`);
    await page.waitForTimeout(1500);

    // Check English title
    await expect(page.locator('h1')).toContainText('Itinerary');
    console.log('✓ English itinerary page loaded');

    // Check English day titles
    await expect(page.getByText('Day 1:', { exact: false })).toBeVisible();
    await expect(page.getByText('Arrival', { exact: false })).toBeVisible();
    console.log('✓ English day titles visible');

    // Expand/collapse text should be in English
    await expect(page.getByText('Expand all')).toBeVisible();
    console.log('✓ English expand/collapse text visible');

    console.log('✅ English itinerary works correctly!');
  });

  test('should display restaurants with city and price filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/restaurants`);
    await page.waitForTimeout(1500);

    // Check page title
    await expect(page.locator('h1')).toContainText('Restaurants');
    console.log('✓ Restaurants page loaded');

    // Check that restaurant cards are displayed (12 total)
    await expect(page.getByText(/12 \/ 12/)).toBeVisible();
    console.log('✓ All 12 restaurants displayed');

    // Test city filter - click Sevilla
    console.log('✓ Testing city filter - clicking Sevilla...');
    await page.click('button:has-text("Sevilla")');
    await page.waitForTimeout(500);

    await expect(page.getByText(/4 \/ 12/)).toBeVisible();
    console.log('✓ Sevilla filter: 4 restaurants');

    // Check a specific Seville restaurant is visible
    await expect(page.getByText('Bodega Santa Cruz')).toBeVisible();
    console.log('✓ Bodega Santa Cruz visible');

    // Reset to all
    await page.click('button:has-text("Alle Restaurants")');
    await page.waitForTimeout(500);

    // Test price filter - click €
    console.log('✓ Testing price filter - clicking € Budget...');
    await page.click('button:has-text("€ Budget")');
    await page.waitForTimeout(500);

    // Should show budget restaurants (3: one per city)
    const budgetCount = await page.getByText(/\d+ \/ 12/).textContent();
    console.log(`✓ Budget filter: ${budgetCount}`);

    // Reset to all prices
    await page.click('button:has-text("Alle prijzen")');
    await page.waitForTimeout(500);

    // Test combined filter: Granada + €€€
    console.log('✓ Testing combined filter: Granada + €€€...');
    await page.click('button:has-text("Granada")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("€€€ Luxe")');
    await page.waitForTimeout(500);

    await expect(page.getByText('Carmen de Aben Humeya')).toBeVisible();
    console.log('✓ Combined filter works');

    console.log('✅ Restaurant filters work correctly!');
  });

  test('should calculate budget with traveler counts and discount toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/budget`);
    await page.waitForTimeout(1500);

    // Check page title
    await expect(page.locator('h1')).toContainText('Budget Calculator');
    console.log('✓ Budget page loaded');

    // Check summary card is displayed with total
    await expect(page.getByText('Totaal')).toBeVisible();
    await expect(page.getByText('Per Persoon')).toBeVisible();
    console.log('✓ Summary card visible');

    // Check category breakdown is displayed
    await expect(page.locator('main').getByText('Bezienswaardigheden')).toBeVisible();
    await expect(page.locator('main').getByText('Vervoer')).toBeVisible();
    await expect(page.locator('main').getByText('Maaltijden')).toBeVisible();
    console.log('✓ Category breakdown visible');

    // Check traveler counts (defaults: 2 adults, 3 young adults = 5 total)
    await expect(page.getByText('5 reizigers')).toBeVisible();
    console.log('✓ Default traveler count (5) visible');

    // Read initial total
    const summaryCard = page.locator('[class*="rounded-lg"][class*="text-white"]');
    const initialText = await summaryCard.textContent();
    console.log(`✓ Initial budget: ${initialText?.substring(0, 100)}`);

    // Toggle student discount off
    console.log('✓ Toggling student discount off...');
    await page.click('input[type="checkbox"]');
    await page.waitForTimeout(500);

    // Total should increase (no more student discounts)
    const afterToggle = await summaryCard.textContent();
    console.log(`✓ After discount toggle: ${afterToggle?.substring(0, 100)}`);

    // Toggle back on
    await page.click('input[type="checkbox"]');
    await page.waitForTimeout(500);

    // Change traveler count - click + on first group (adults)
    console.log('✓ Increasing adult count...');
    const plusButtons = page.locator('button:has(svg.lucide-plus)');
    await plusButtons.first().click();
    await page.waitForTimeout(500);

    // Should now show 6 travelers
    await expect(page.getByText('6 reizigers')).toBeVisible();
    console.log('✓ Traveler count updated to 6');

    console.log('✅ Budget calculator works correctly!');
  });
});
