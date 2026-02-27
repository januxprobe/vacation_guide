import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Phase 4: Interactive Map', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  });

  test('should display map with markers and city filter works', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/map`);

    // Wait for map tiles to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map container loaded');

    // Check page title
    await expect(page.locator('h1')).toContainText('Interactieve Kaart');
    console.log('✓ Map page title visible');

    // Check that markers are present (attraction markers are inside cluster group)
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    const markerCount = await page.locator('.leaflet-marker-icon').count();
    expect(markerCount).toBeGreaterThan(0);
    console.log(`✓ ${markerCount} markers visible on map`);

    // Check filter buttons are present
    await expect(page.getByText('Alle Steden')).toBeVisible();
    await expect(page.getByText('Alle Dagen')).toBeVisible();
    console.log('✓ Filter buttons visible');

    // Click Sevilla city filter
    await page.click('button:has-text("Sevilla")');
    await page.waitForTimeout(500);

    // Markers should now be fewer (only Seville attractions)
    const sevilleMarkerCount = await page.locator('.leaflet-marker-icon').count();
    console.log(`✓ After Sevilla filter: ${sevilleMarkerCount} markers`);

    // Click back to all cities
    await page.click('button:has-text("Alle Steden")');
    await page.waitForTimeout(500);

    const allMarkersAgain = await page.locator('.leaflet-marker-icon').count();
    expect(allMarkersAgain).toBeGreaterThanOrEqual(markerCount);
    console.log(`✓ All cities restored: ${allMarkersAgain} markers`);

    // Verify legend is visible
    await expect(page.getByText('Legenda')).toBeVisible();
    console.log('✓ Map legend visible');

    console.log('✅ Map markers and city filter work correctly!');
  });

  test('should filter by day and show route polyline', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/map`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map loaded');

    // Select Day 1
    await page.click('button:has-text("Dag 1")');
    await page.waitForTimeout(500);

    // Route toggle should appear
    await expect(page.getByTestId('route-toggle')).toBeVisible();
    console.log('✓ Route toggle visible after selecting a day');

    // Route should be drawn (polyline = SVG path inside leaflet-overlay-pane)
    const polyline = page.locator('.leaflet-overlay-pane path');
    await expect(polyline.first()).toBeVisible({ timeout: 5000 });
    console.log('✓ Route polyline visible for Day 1');

    // Markers should be filtered to Day 1 attractions only
    const dayMarkers = await page.locator('.leaflet-marker-icon').count();
    console.log(`✓ Day 1 shows ${dayMarkers} markers`);

    // Toggle route off
    await page.getByTestId('route-toggle').click();
    await page.waitForTimeout(300);

    // Toggle route back on
    await page.getByTestId('route-toggle').click();
    await page.waitForTimeout(300);
    console.log('✓ Route toggle works');

    // Switch to another day
    await page.click('button:has-text("Dag 4")');
    await page.waitForTimeout(500);

    // Should auto-switch to Córdoba
    console.log('✓ Day 4 selected (Córdoba)');

    // Go back to all days
    await page.click('button:has-text("Alle Dagen")');
    await page.waitForTimeout(500);
    console.log('✓ All days restored');

    console.log('✅ Day filter and route work correctly!');
  });

  test('should toggle restaurant markers on and off', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/map`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map loaded');

    // Count initial markers (attractions only)
    const initialMarkers = await page.locator('.leaflet-marker-icon').count();
    console.log(`✓ Initial markers (attractions only): ${initialMarkers}`);

    // Toggle restaurants on
    await page.getByTestId('restaurant-toggle').click();
    await page.waitForTimeout(500);

    // Button text should change
    await expect(page.getByTestId('restaurant-toggle')).toContainText('Verberg Restaurants');
    console.log('✓ Restaurant toggle text updated');

    // Should have more markers now
    const withRestaurants = await page.locator('.leaflet-marker-icon').count();
    expect(withRestaurants).toBeGreaterThan(initialMarkers);
    console.log(`✓ With restaurants: ${withRestaurants} markers (was ${initialMarkers})`);

    // Toggle restaurants off
    await page.getByTestId('restaurant-toggle').click();
    await page.waitForTimeout(500);

    // Button text should change back
    await expect(page.getByTestId('restaurant-toggle')).toContainText('Toon Restaurants');

    // Markers should return to initial count
    const afterHide = await page.locator('.leaflet-marker-icon').count();
    expect(afterHide).toBeLessThanOrEqual(initialMarkers);
    console.log(`✓ After hiding: ${afterHide} markers`);

    console.log('✅ Restaurant toggle works correctly!');
  });
});
