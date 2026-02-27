import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Phase 3: Itinerary, Restaurants & Budget', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should display planner panel with activities and meals', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Planner loaded');

    // Day 1 panel should show Seville activities by default
    // Scope to panel area to avoid matching map tooltips
    await expect(page.getByRole('button', { name: /Real Alcázar/ }).first()).toBeVisible();
    console.log('✓ Day 1 shows Real Alcázar activity');

    // Check meal entries are visible in panel
    await expect(page.getByText('Ontbijt', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Lunch', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Diner', { exact: false }).first()).toBeVisible();
    console.log('✓ Meal entries visible in panel');

    // Switch to Day 4 (Córdoba)
    await page.click('[role="tab"]:has-text("Dag 4")');
    await page.waitForTimeout(800);

    // Panel should show Córdoba content
    await expect(page.getByRole('button', { name: /Mezquita/ }).first()).toBeVisible();
    console.log('✓ Day 4 panel shows Mezquita');

    // Switch back to Day 1
    await page.click('[role="tab"]:has-text("Dag 1")');
    await page.waitForTimeout(800);

    await expect(page.getByRole('button', { name: /Real Alcázar/ }).first()).toBeVisible();
    console.log('✓ Day 1 panel restored');

    console.log('✅ Planner panel with activities and meals works correctly!');
  });

  test('should display planner in English', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ English planner loaded');

    // Check English day tabs
    await expect(page.locator('[role="tab"]').first()).toContainText('Day 1');
    console.log('✓ English day tabs visible');

    // Check panel shows English content
    await expect(page.getByText('Arrival', { exact: false })).toBeVisible();
    console.log('✓ English day title visible');

    // Check English route/restaurant labels
    await expect(page.getByText('Show Route')).toBeVisible();
    await expect(page.getByText('Show Restaurants')).toBeVisible();
    console.log('✓ English toggle labels visible');

    console.log('✅ English planner works correctly!');
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
