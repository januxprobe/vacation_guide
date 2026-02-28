import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Planner Map', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  });

  test('should display markers and update when switching days', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map container loaded');

    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    const day1Markers = await page.locator('.leaflet-marker-icon').count();
    expect(day1Markers).toBeGreaterThan(0);
    console.log(`✓ Day 1: ${day1Markers} markers visible`);

    await page.click('[role="tab"]:has-text("Dag 4")');
    await page.waitForTimeout(800);

    const day4Markers = await page.locator('.leaflet-marker-icon').count();
    expect(day4Markers).toBeGreaterThan(0);
    console.log(`✓ Day 4: ${day4Markers} markers visible`);

    await page.click('[role="tab"]:has-text("Dag 1")');
    await page.waitForTimeout(800);

    expect(await page.locator('.leaflet-marker-icon').count()).toBe(day1Markers);
    console.log(`✓ Day 1 restored: ${day1Markers} markers`);

    await expect(page.getByText('Legenda')).toBeVisible();
    console.log('✓ Map legend visible');

    console.log('✅ Map markers and day switching work correctly!');
  });

  test('should show and toggle route polyline', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map loaded');

    const routeCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(routeCheckbox).toBeChecked();
    console.log('✓ Route checkbox checked by default');

    const polyline = page.locator('.leaflet-overlay-pane path');
    await expect(polyline.first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Route polyline visible');

    await routeCheckbox.click();
    await page.waitForTimeout(500);

    expect(await page.locator('.leaflet-overlay-pane path').count()).toBe(0);
    console.log('✓ Route polyline hidden after unchecking');

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

    const initialMarkers = await page.locator('.leaflet-marker-icon').count();
    console.log(`✓ Initial markers (attractions only): ${initialMarkers}`);

    const restaurantCheckbox = page.locator('label:has-text("Toon Restaurants") input[type="checkbox"]');
    await expect(restaurantCheckbox).not.toBeChecked();
    console.log('✓ Restaurant checkbox unchecked by default');

    await restaurantCheckbox.click();
    await page.waitForTimeout(500);

    const withRestaurants = await page.locator('.leaflet-marker-icon').count();
    expect(withRestaurants).toBeGreaterThan(initialMarkers);
    console.log(`✓ With restaurants: ${withRestaurants} markers (was ${initialMarkers})`);

    await restaurantCheckbox.click();
    await page.waitForTimeout(500);

    const afterHide = await page.locator('.leaflet-marker-icon').count();
    expect(afterHide).toBeLessThanOrEqual(initialMarkers);
    console.log(`✓ After hiding: ${afterHide} markers`);

    console.log('✅ Restaurant toggle works correctly!');
  });
});
