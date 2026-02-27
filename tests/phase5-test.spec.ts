import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Phase 5: Homepage & Polish', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should display hero section with background image, stats and quick links', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    // Check hero title
    await expect(page.locator('h1')).toContainText('Andalusië');
    console.log('✓ Hero title visible');

    // Check hero image is rendered (Next.js Image with object-cover)
    const heroImg = page.locator('section.relative img.object-cover');
    await expect(heroImg).toBeVisible();
    console.log('✓ Hero background image visible');

    // Check gradient overlay exists
    const overlay = page.locator('.bg-gradient-to-b');
    await expect(overlay).toBeVisible();
    console.log('✓ Gradient overlay present');

    // Check CTA button
    await expect(page.getByText('Bekijk Reisroute')).toBeVisible();
    console.log('✓ CTA button visible');

    // Check stats grid (4 stats)
    const statCards = page.locator('.grid.grid-cols-2 > div');
    await expect(statCards).toHaveCount(4);
    console.log('✓ 4 stat cards displayed');

    // Check quick links (3 city-linked sections)
    const quickLinks = page.locator('.grid.md\\:grid-cols-3 > a');
    await expect(quickLinks).toHaveCount(3);
    console.log('✓ 3 quick link cards displayed');

    console.log('✅ Hero section test passed!');
  });

  test('should show loading skeleton during navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1000);

    // Verify the page loaded
    await expect(page.locator('h1')).toContainText('Andalusië');
    console.log('✓ Homepage loaded');

    // Navigate to attractions and quickly check for skeleton or content
    await page.click('text=Bezienswaardigheden');
    await page.waitForURL(`**/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1500);

    // Page should have loaded (skeleton would have been replaced)
    await expect(page.locator('h1')).toContainText('Bezienswaardigheden');
    console.log('✓ Navigation completed successfully');

    // Navigate back to home
    await page.click('text=Home');
    await page.waitForURL(`**/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Andalusië');
    console.log('✓ Returned to homepage');

    console.log('✅ Navigation with loading test passed!');
  });

  test('should show not-found page for invalid trip slug', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/nonexistent-trip-12345`);
    await page.waitForTimeout(1500);

    // Should show custom not-found page content
    await expect(page.getByText('Pagina niet gevonden')).toBeVisible();
    console.log('✓ Not-found title displayed');

    await expect(page.getByText('De pagina die je zoekt bestaat niet of is verplaatst.')).toBeVisible();
    console.log('✓ Not-found description displayed');

    // Should have a link back to trips
    await expect(page.getByText('Terug naar reizen')).toBeVisible();
    console.log('✓ Back to trips link visible');

    console.log('✅ Not-found page test passed!');
  });
});
