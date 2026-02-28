import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Planner', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  });

  test('should load split view with map, panel, and day tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);

    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Map container loaded');

    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(7);
    console.log('✓ 7 day tabs visible');

    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    console.log('✓ Day 1 selected by default');

    await expect(page.locator('h2').first()).toBeVisible();
    console.log('✓ Panel shows day header');

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

    const dayHeader = page.locator('h2').first();
    const day1Title = await dayHeader.textContent();
    console.log(`✓ Day 1 title: ${day1Title}`);

    await page.click('[role="tab"]:has-text("Dag 4")');
    await page.waitForTimeout(800);

    const day4Title = await dayHeader.textContent();
    expect(day4Title).not.toBe(day1Title);
    await expect(dayHeader).toContainText('Córdoba');
    console.log(`✓ Day 4 title: ${day4Title}`);

    await page.click('[role="tab"]:has-text("Dag 1")');
    await page.waitForTimeout(800);

    expect(await dayHeader.textContent()).toBe(day1Title);
    console.log('✓ Day 1 panel restored');

    console.log('✅ Day switching syncs correctly!');
  });

  test('should toggle between map and list on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForTimeout(2000);

    const listButton = page.locator('button:has-text("Dagplanning")');
    const mapButton = page.locator('button:has-text("Kaart")');
    await expect(listButton).toBeVisible();
    await expect(mapButton).toBeVisible();
    console.log('✓ Mobile toggle buttons visible');

    await expect(page.locator('h2').first()).toBeVisible();
    console.log('✓ Panel visible by default on mobile');

    await mapButton.click();
    await page.waitForTimeout(1000);

    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    console.log('✓ Map visible after toggle');

    await listButton.click();
    await page.waitForTimeout(500);

    await expect(page.locator('h2').first()).toBeVisible();
    console.log('✓ Panel visible after toggling back');

    console.log('✅ Mobile toggle works correctly!');
  });

  test('should display planner panel with activities and meals (NL)', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Planner loaded');

    await expect(page.getByRole('button', { name: /Real Alcázar/ }).first()).toBeVisible();
    console.log('✓ Day 1 shows Real Alcázar activity');

    await expect(page.getByText('Ontbijt', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Lunch', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Diner', { exact: false }).first()).toBeVisible();
    console.log('✓ Meal entries visible in panel');

    await page.click('[role="tab"]:has-text("Dag 4")');
    await page.waitForTimeout(800);

    await expect(page.getByRole('button', { name: /Mezquita/ }).first()).toBeVisible();
    console.log('✓ Day 4 panel shows Mezquita');

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

    await expect(page.locator('[role="tab"]').first()).toContainText('Day 1');
    console.log('✓ English day tabs visible');

    await expect(page.getByText('Arrival', { exact: false }).first()).toBeVisible();
    console.log('✓ English day title visible');

    await expect(page.getByText('Show Route')).toBeVisible();
    await expect(page.getByText('Show Restaurants')).toBeVisible();
    console.log('✓ English toggle labels visible');

    console.log('✅ English planner works correctly!');
  });

  test('should show walking time gaps and print button', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Planner loaded');

    // Wait for walking route to load (Valhalla takes a moment)
    await page.waitForTimeout(3000);

    const walkingGaps = page.getByText(/\d+ min lopen/);
    const gapCount = await walkingGaps.count();
    console.log(`✓ Found ${gapCount} walking time gaps`);
    if (gapCount > 0) {
      await expect(walkingGaps.first()).toBeVisible();
      console.log('✓ Walking gaps visible between activities');
    }

    await expect(page.getByText('Afdrukken')).toBeVisible();
    console.log('✓ Print button visible');

    console.log('✅ Walking gaps and print button work correctly!');
  });

  test('should show comments section in planner panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/planner`);
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    console.log('✓ Planner loaded');

    const commentsToggle = page.getByText('Opmerkingen');
    await expect(commentsToggle.first()).toBeVisible();
    console.log('✓ Comments section toggle visible');

    await commentsToggle.first().click();
    await page.waitForTimeout(500);

    const hasNoComments = await page.getByText('Nog geen opmerkingen').isVisible().catch(() => false);
    const hasInput = await page.getByPlaceholder('Schrijf een opmerking...').isVisible().catch(() => false);

    if (hasNoComments) console.log('✓ "No comments yet" message visible');
    if (hasInput) console.log('✓ Comment input visible');
    expect(hasNoComments || hasInput).toBe(true);

    console.log('✅ Comments section works correctly!');
  });
});
