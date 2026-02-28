import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Not Found Pages', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should show not-found page in Dutch', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/nonexistent-trip-12345`);
    await page.waitForTimeout(1500);

    await expect(page.getByText('Pagina niet gevonden')).toBeVisible();
    console.log('✓ Dutch not-found title displayed');

    await expect(page.getByText('De pagina die je zoekt bestaat niet of is verplaatst.')).toBeVisible();
    console.log('✓ Dutch not-found description displayed');

    await expect(page.getByText('Terug naar reizen')).toBeVisible();
    console.log('✓ Dutch back to trips link visible');

    console.log('✅ Dutch not-found page works correctly!');
  });

  test('should show not-found page in English', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/nonexistent-trip-12345`);
    await page.waitForTimeout(1500);

    await expect(page.getByText('Page not found')).toBeVisible();
    console.log('✓ English not-found title visible');

    await expect(page.getByText('The page you are looking for does not exist')).toBeVisible();
    console.log('✓ English not-found description visible');

    await expect(page.getByText('Back to trips')).toBeVisible();
    console.log('✓ English back link visible');

    console.log('✅ English not-found page works correctly!');
  });
});
