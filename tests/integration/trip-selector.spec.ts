import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Trip Selector', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 3000,
  });

  test('should show trip selector on locale homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl`);

    console.log('✓ Testing trip selector page...');
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Jouw Reizen');

    await expect(page.getByText('Andalusië Vakantiegids')).toBeVisible();
    console.log('✓ Andalusia trip card visible');

    await expect(page.getByText('Nieuwe Reis Maken')).toBeVisible();
    console.log('✓ Create new trip card visible');

    await page.click('text=Andalusië Vakantiegids');
    await page.waitForURL(`**/nl/${TRIP_SLUG}`);
    await expect(page.locator('h1')).toContainText('Andalusië');
    console.log('✓ Trip card navigation works');

    console.log('✅ Trip selector works correctly!');
  });
});
