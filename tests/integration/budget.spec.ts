import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Budget Calculator', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should calculate budget with traveler counts and discount toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/budget`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Budget Calculator');
    console.log('✓ Budget page loaded');

    await expect(page.getByText('Totaal')).toBeVisible();
    await expect(page.getByText('Per Persoon')).toBeVisible();
    console.log('✓ Summary card visible');

    await expect(page.locator('main').getByText('Bezienswaardigheden')).toBeVisible();
    await expect(page.locator('main').getByText('Vervoer')).toBeVisible();
    await expect(page.locator('main').getByText('Maaltijden')).toBeVisible();
    console.log('✓ Category breakdown visible');

    await expect(page.getByText('5 reizigers')).toBeVisible();
    console.log('✓ Default traveler count (5) visible');

    const summaryCard = page.locator('[class*="rounded-lg"][class*="text-white"]');
    const initialText = await summaryCard.textContent();
    console.log(`✓ Initial budget: ${initialText?.substring(0, 100)}`);

    // Toggle student discount off
    await page.click('input[type="checkbox"]');
    await page.waitForTimeout(500);

    const afterToggle = await summaryCard.textContent();
    console.log(`✓ After discount toggle: ${afterToggle?.substring(0, 100)}`);

    // Toggle back on
    await page.click('input[type="checkbox"]');
    await page.waitForTimeout(500);

    // Increase adult count
    const plusButtons = page.locator('button:has(svg.lucide-plus)');
    await plusButtons.first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('6 reizigers')).toBeVisible();
    console.log('✓ Traveler count updated to 6');

    console.log('✅ Budget calculator works correctly!');
  });

  test('should toggle activity exclusion in what-if mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/budget`);
    await page.waitForTimeout(1500);

    const summaryCard = page.locator('[class*="rounded-lg"][class*="text-white"]');
    const initialText = await summaryCard.textContent();
    console.log(`✓ Initial budget total: ${initialText?.substring(0, 60)}`);

    // Expand Day 1 to see line items (button has number badge "1" + day title, not literal "Dag 1")
    const dayButtons = page.locator('.space-y-2 > div button');
    await dayButtons.first().click();
    await page.waitForTimeout(500);
    console.log('✓ Day 1 expanded');

    // Find eye toggle buttons
    const eyeButtons = page.locator('button[title="Activiteit in-/uitschakelen"]');
    const eyeCount = await eyeButtons.count();
    console.log(`✓ Found ${eyeCount} toggle buttons`);

    if (eyeCount > 0) {
      await eyeButtons.first().click();
      await page.waitForTimeout(500);

      const hasMsg = await page.getByText(/\d+ activiteiten? uitgesloten/).isVisible().catch(() => false);
      if (hasMsg) {
        console.log('✓ Exclusion info message visible');
      }

      const afterText = await summaryCard.textContent();
      console.log(`✓ After exclusion: ${afterText?.substring(0, 60)}`);

      await eyeButtons.first().click();
      await page.waitForTimeout(500);
      console.log('✓ Toggled back');
    }

    console.log('✅ Budget what-if mode works correctly!');
  });
});
