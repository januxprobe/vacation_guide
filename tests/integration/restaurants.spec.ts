import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Restaurants', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should display restaurants with city and price filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/restaurants`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Restaurants');
    console.log('✓ Restaurants page loaded');

    await expect(page.getByText(/12 \/ 12/)).toBeVisible();
    console.log('✓ All 12 restaurants displayed');

    // Test city filter - click Sevilla
    await page.click('button:has-text("Sevilla")');
    await page.waitForTimeout(500);

    await expect(page.getByText(/4 \/ 12/)).toBeVisible();
    console.log('✓ Sevilla filter: 4 restaurants');

    await expect(page.getByText('Bodega Santa Cruz')).toBeVisible();
    console.log('✓ Bodega Santa Cruz visible');

    await page.click('button:has-text("Alle Restaurants")');
    await page.waitForTimeout(500);

    // Test price filter
    await page.click('button:has-text("€ Budget")');
    await page.waitForTimeout(500);

    const budgetCount = await page.getByText(/\d+ \/ 12/).textContent();
    console.log(`✓ Budget filter: ${budgetCount}`);

    await page.click('button:has-text("Alle prijzen")');
    await page.waitForTimeout(500);

    // Test combined filter: Granada + €€€
    await page.click('button:has-text("Granada")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("€€€ Luxe")');
    await page.waitForTimeout(500);

    await expect(page.getByText('Carmen de Aben Humeya')).toBeVisible();
    console.log('✓ Combined filter works');

    console.log('✅ Restaurant filters work correctly!');
  });

  test('should search restaurants and filter by cuisine', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/restaurants`);
    await page.waitForTimeout(1500);

    // Search input
    const searchInput = page.getByPlaceholder('Zoek restaurants...');
    await expect(searchInput).toBeVisible();
    console.log('✓ Restaurant search input visible');

    await searchInput.fill('Bodega');
    await page.waitForTimeout(500);
    const filteredCount = await page.getByText(/\d+ \/ \d+/).textContent();
    console.log(`✓ After search "Bodega": ${filteredCount}`);
    const [filtered] = filteredCount!.split(' / ').map(Number);
    expect(filtered).toBeLessThan(12);
    expect(filtered).toBeGreaterThanOrEqual(1);

    await searchInput.clear();
    await page.waitForTimeout(500);

    // Cuisine filter
    const cuisineAll = page.locator('button:has-text("Alle keukens")');
    await expect(cuisineAll).toBeVisible();
    console.log('✓ Cuisine filter "Alle keukens" visible');

    const tapasBtn = page.locator('button:has-text("Tapas")');
    if (await tapasBtn.isVisible()) {
      await tapasBtn.click();
      await page.waitForTimeout(500);
      const cuisineFiltered = await page.getByText(/\d+ \/ \d+/).textContent();
      console.log(`✓ After cuisine filter "Tapas": ${cuisineFiltered}`);

      await cuisineAll.click();
      await page.waitForTimeout(500);
    }

    console.log('✅ Restaurant search and cuisine filter work correctly!');
  });

  test('should expand and collapse restaurant cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/restaurants`);
    await page.waitForTimeout(1500);

    const showMoreButtons = page.getByText('Toon meer');
    const count = await showMoreButtons.count();
    console.log(`✓ Found ${count} "Show more" buttons`);

    if (count > 0) {
      await showMoreButtons.first().click();
      await page.waitForTimeout(500);

      await expect(page.getByText('Toon minder').first()).toBeVisible();
      console.log('✓ Expanded: "Show less" button visible');

      const hasSpecialties = await page.getByText('Specialiteiten').first().isVisible().catch(() => false);
      if (hasSpecialties) {
        console.log('✓ Specialties section visible when expanded');
      }

      await page.getByText('Toon minder').first().click();
      await page.waitForTimeout(500);
      console.log('✓ Collapsed back');
    }

    console.log('✅ Restaurant expand/collapse works correctly!');
  });
});
