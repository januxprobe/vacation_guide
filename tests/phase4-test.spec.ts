import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Phase 4: Planner Map Features', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  });

  test('should display map with markers and switch days changes markers', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map container loaded');

    // Check that numbered markers are present for Day 1
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    const day1Markers = await page.locator('.leaflet-marker-icon').count();
    expect(day1Markers).toBeGreaterThan(0);
    console.log(`✓ Day 1: ${day1Markers} markers visible`);

    // Switch to Day 4 (Córdoba) — marker count should change
    await page.click('[role="tab"]:has-text("Dag 4")');
    await page.waitForTimeout(800);

    const day4Markers = await page.locator('.leaflet-marker-icon').count();
    expect(day4Markers).toBeGreaterThan(0);
    console.log(`✓ Day 4: ${day4Markers} markers visible`);

    // Switch back to Day 1
    await page.click('[role="tab"]:has-text("Dag 1")');
    await page.waitForTimeout(800);

    const backToDay1 = await page.locator('.leaflet-marker-icon').count();
    expect(backToDay1).toBe(day1Markers);
    console.log(`✓ Day 1 restored: ${backToDay1} markers`);

    // Verify legend is visible
    await expect(page.getByText('Legenda')).toBeVisible();
    console.log('✓ Map legend visible');

    console.log('✅ Map markers and day switching work correctly!');
  });

  test('should show and toggle route polyline', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map loaded');

    // Route checkbox should be visible and checked by default
    const routeCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(routeCheckbox).toBeChecked();
    console.log('✓ Route checkbox checked by default');

    // Route polyline should be visible (SVG path in leaflet-overlay-pane)
    // OSRM walking route may take a moment to load
    const polyline = page.locator('.leaflet-overlay-pane path');
    await expect(polyline.first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Route polyline visible');

    // Uncheck route — polyline should disappear
    await routeCheckbox.click();
    await page.waitForTimeout(500);

    const polylineCount = await page.locator('.leaflet-overlay-pane path').count();
    expect(polylineCount).toBe(0);
    console.log('✓ Route polyline hidden after unchecking');

    // Re-check route
    await routeCheckbox.click();
    await page.waitForTimeout(1000);

    await expect(page.locator('.leaflet-overlay-pane path').first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Route polyline restored');

    console.log('✅ Route polyline toggle works correctly!');
  });

  test('should toggle restaurant markers on and off', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map loaded');

    // Count initial markers (attractions only)
    const initialMarkers = await page.locator('.leaflet-marker-icon').count();
    console.log(`✓ Initial markers (attractions only): ${initialMarkers}`);

    // Restaurant checkbox should exist and be unchecked
    const restaurantCheckbox = page.locator('label:has-text("Toon Restaurants") input[type="checkbox"]');
    await expect(restaurantCheckbox).not.toBeChecked();
    console.log('✓ Restaurant checkbox unchecked by default');

    // Check restaurant toggle — should add more markers
    await restaurantCheckbox.click();
    await page.waitForTimeout(500);

    const withRestaurants = await page.locator('.leaflet-marker-icon').count();
    expect(withRestaurants).toBeGreaterThan(initialMarkers);
    console.log(`✓ With restaurants: ${withRestaurants} markers (was ${initialMarkers})`);

    // Uncheck — markers should return to original count
    await restaurantCheckbox.click();
    await page.waitForTimeout(500);

    const afterHide = await page.locator('.leaflet-marker-icon').count();
    expect(afterHide).toBeLessThanOrEqual(initialMarkers);
    console.log(`✓ After hiding: ${afterHide} markers`);

    console.log('✅ Restaurant toggle works correctly!');
  });
});
