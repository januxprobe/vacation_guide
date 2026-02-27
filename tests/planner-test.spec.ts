import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Planner: Split View', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  });

  test('should load split view with map, panel, and day tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);

    // Wait for the map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map container loaded');

    // Check day tabs are present (7 days)
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(7);
    console.log('✓ 7 day tabs visible');

    // Day 1 should be selected by default
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    console.log('✓ Day 1 selected by default');

    // Panel should show Day 1 content — check the day header which has city name as bold text
    await expect(page.locator('h2').first()).toBeVisible();
    console.log('✓ Panel shows day header');

    // Should have numbered markers on the map
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers.first()).toBeVisible({ timeout: 5000 });
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);
    console.log(`✓ ${markerCount} numbered markers visible on map`);

    console.log('✅ Planner split view loads correctly!');
  });

  test('should sync day switching between tabs and panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map loaded');

    // Get the day header h2 text for Day 1
    const dayHeader = page.locator('h2').first();
    const day1Title = await dayHeader.textContent();
    console.log(`✓ Day 1 title: ${day1Title}`);

    // Switch to Day 4 (Córdoba)
    await page.click('[role="tab"]:has-text("Dag 4")');
    await page.waitForTimeout(800);

    // Panel header should have changed — check it contains Córdoba info
    const day4Title = await dayHeader.textContent();
    expect(day4Title).not.toBe(day1Title);
    console.log(`✓ Day 4 title: ${day4Title}`);

    // The heading should contain Córdoba-related text
    await expect(dayHeader).toContainText('Córdoba');
    console.log('✓ Day 4 panel shows Córdoba content');

    // Switch back to Day 1
    await page.click('[role="tab"]:has-text("Dag 1")');
    await page.waitForTimeout(800);

    // Panel should show Day 1 content again
    const backToDay1 = await dayHeader.textContent();
    expect(backToDay1).toBe(day1Title);
    console.log('✓ Day 1 panel restored');

    console.log('✅ Day switching syncs correctly!');
  });

  test('should toggle between map and list on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForTimeout(2000);

    // Should see mobile toggle buttons
    const listButton = page.locator('button:has-text("Dagplanning")');
    const mapButton = page.locator('button:has-text("Kaart")');
    await expect(listButton).toBeVisible();
    await expect(mapButton).toBeVisible();
    console.log('✓ Mobile toggle buttons visible');

    // Panel should be visible by default (list view) — check for day header
    await expect(page.locator('h2').first()).toBeVisible();
    console.log('✓ Panel visible by default on mobile');

    // Switch to map view
    await mapButton.click();
    await page.waitForTimeout(1000);

    // Map should now be visible
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    console.log('✓ Map visible after toggle');

    // Switch back to list view
    await listButton.click();
    await page.waitForTimeout(500);

    // Panel should be visible again
    await expect(page.locator('h2').first()).toBeVisible();
    console.log('✓ Panel visible after toggling back');

    console.log('✅ Mobile toggle works correctly!');
  });
});
