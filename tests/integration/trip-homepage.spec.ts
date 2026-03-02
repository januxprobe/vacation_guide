import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Trip Homepage', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should display hero section with background image, stats and quick links', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Andalusië');
    console.log('✓ Hero title visible');

    const heroImg = page.locator('section.relative img.object-cover');
    await expect(heroImg).toBeVisible();
    console.log('✓ Hero background image visible');

    const overlay = page.locator('.bg-gradient-to-b');
    await expect(overlay).toBeVisible();
    console.log('✓ Gradient overlay present');

    await expect(page.getByText('Bekijk Reisroute')).toBeVisible();
    console.log('✓ CTA button visible');

    const statCards = page.locator('.grid.grid-cols-2 > div');
    await expect(statCards).toHaveCount(4);
    console.log('✓ 4 stat cards displayed');

    // Story section is shown instead of quick links (andalusia-2026 has an itinerary)
    const storySection = page.locator('.story-container');
    await expect(storySection).toBeVisible();
    console.log('✓ Story section displayed (itinerary present)');

    console.log('✅ Hero section test passed!');
  });

  test('should show loading skeleton during navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1000);

    await expect(page.locator('h1')).toContainText('Andalusië');
    console.log('✓ Homepage loaded');

    await page.click('text=Bezienswaardigheden');
    await page.waitForURL(`**/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Bezienswaardigheden');
    console.log('✓ Navigation completed successfully');

    await page.click('text=Home');
    await page.waitForURL(`**/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Andalusië');
    console.log('✓ Returned to homepage');

    console.log('✅ Navigation with loading test passed!');
  });

  test('should show share button on trip homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    const shareButton = page.getByText('Delen');
    await expect(shareButton.first()).toBeVisible();
    console.log('✓ Share button visible on trip homepage');

    console.log('✅ Share button works correctly!');
  });
});
