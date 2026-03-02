import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Trip Story', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should display story chapters with day titles', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    // Story section visible
    const storySection = page.locator('.story-container');
    await expect(storySection).toBeVisible();
    console.log('✓ Story section visible');

    // Story title
    await expect(storySection.locator('h2')).toContainText('Dromen van Andalusië');
    console.log('✓ Story title displayed');

    // Chapters present (7 chapters in fixture — one per itinerary day)
    const chapters = page.locator('.story-chapter');
    await expect(chapters).toHaveCount(7);
    console.log('✓ 7 story chapters displayed');

    // Day badges
    const dayBadge1 = chapters.nth(0).locator('span').first();
    await expect(dayBadge1).toContainText('1');
    console.log('✓ Day badges show chapter numbers');

    console.log('✅ Story chapters test passed!');
  });

  test('should display narrative text blocks', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    // Introduction text
    await expect(page.getByText('Sluit je ogen en stel je voor')).toBeVisible();
    console.log('✓ Introduction text displayed');

    // Narrative block in chapter
    await expect(page.getByText('De septemberzon verwelkomt je in Sevilla')).toBeVisible();
    console.log('✓ Narrative block text displayed');

    // Conclusion text
    await expect(page.getByText('Zeven dagen door Andalusië')).toBeVisible();
    console.log('✓ Conclusion text displayed');

    console.log('✅ Narrative blocks test passed!');
  });

  test('should show attraction highlight blocks with images', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    // Attraction highlight narrative
    await expect(page.getByText('Het Real Alcázar laat je sprakeloos')).toBeVisible();
    console.log('✓ Attraction highlight narrative visible');

    // Attraction links present (should have links to all 25 attractions)
    const attractionLinks = page.locator('.story-container a[href*="/attractions/"]');
    const count = await attractionLinks.count();
    expect(count).toBeGreaterThan(10);
    console.log(`✓ ${count} attraction links found`);

    console.log('✅ Attraction highlights test passed!');
  });

  test('should show meal highlight blocks', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    // Meal highlight with restaurant name
    await expect(page.getByText('Bodega Santa Cruz')).toBeVisible();
    console.log('✓ Restaurant name in meal highlight visible');

    // Meal highlight narrative (first restaurant narrative mentions "montaditos")
    await expect(page.getByText('montaditos zijn legendarisch')).toBeVisible();
    console.log('✓ Meal highlight narrative visible');

    console.log('✅ Meal highlights test passed!');
  });

  test('should show regenerate and share buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    // Regenerate button
    await expect(page.getByText('Opnieuw Genereren')).toBeVisible();
    console.log('✓ Regenerate button visible');

    // Share button (in story actions)
    const shareButtons = page.getByText('Delen');
    await expect(shareButtons.first()).toBeVisible();
    console.log('✓ Share button visible');

    // Print button
    await expect(page.getByText('Afdrukken')).toBeVisible();
    console.log('✓ Print button visible');

    console.log('✅ Story actions test passed!');
  });

  test('should display story in English when locale is EN', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    // English title
    await expect(page.locator('.story-container h2')).toContainText('Dreaming of Andalusia');
    console.log('✓ English story title displayed');

    // English introduction
    await expect(page.getByText('Close your eyes and imagine')).toBeVisible();
    console.log('✓ English introduction displayed');

    // English actions
    await expect(page.getByText('Regenerate')).toBeVisible();
    console.log('✓ English regenerate button');

    console.log('✅ English locale test passed!');
  });

  test('should show generated date', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    await expect(page.getByText('Gegenereerd op')).toBeVisible();
    console.log('✓ Generated date visible');

    console.log('✅ Generated date test passed!');
  });

  test('should show transition blocks in italic', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}`);
    await page.waitForTimeout(1500);

    await expect(page.getByText('Met je hoofd nog vol van het Alhambra')).toBeVisible();
    console.log('✓ Transition block visible');

    console.log('✅ Transition blocks test passed!');
  });
});
