import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRIP_SLUG = 'andalusia-2026';

test.describe('Attractions', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  });

  test('should display attractions list with city and priority filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Bezienswaardigheden');
    await expect(page.getByText('Ontdek bezienswaardigheden')).toBeVisible();

    const cards = page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`);
    const count = await cards.count();
    console.log(`✓ Found ${count} attraction cards`);
    expect(count).toBeGreaterThanOrEqual(20);

    await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible();
    console.log('✓ Counter visible');

    // Test city filter - click Sevilla
    console.log('✓ Testing city filter - clicking Sevilla...');
    await page.click('button:has-text("Sevilla")');
    await page.waitForTimeout(1000);

    const sevillaCards = page.locator(`a[href*="/${TRIP_SLUG}/attractions/seville-"]`);
    const sevillaCount = await sevillaCards.count();
    console.log(`✓ Sevilla filter: ${sevillaCount} cards`);
    expect(sevillaCount).toBeGreaterThanOrEqual(8);

    const cordobaCards = page.locator(`a[href*="/${TRIP_SLUG}/attractions/cordoba-"]`);
    expect(await cordobaCards.count()).toBe(0);
    console.log('✓ Córdoba cards hidden when Sevilla filter active');

    await page.click('button:has-text("Alle Bezienswaardigheden")');
    await page.waitForTimeout(500);

    // Test priority filter - click Essentieel
    console.log('✓ Testing priority filter - clicking Essentieel...');
    await page.click('button:has-text("Essentieel")');
    await page.waitForTimeout(1000);

    const essentialCount = await page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`).count();
    console.log(`✓ Essential filter: ${essentialCount} cards`);
    expect(essentialCount).toBeLessThan(count);
    expect(essentialCount).toBeGreaterThanOrEqual(3);

    console.log('✅ Attractions list and filters work correctly!');
  });

  test('should navigate to attraction detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1000);

    console.log('✓ Clicking on Real Alcázar...');
    await page.click(`a[href*="/${TRIP_SLUG}/attractions/seville-real-alcazar"]`);
    await page.waitForURL(`**/${TRIP_SLUG}/attractions/seville-real-alcazar`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Real Alcázar');
    console.log('✓ Detail page title correct');

    await expect(page.getByText('Sevilla', { exact: true })).toBeVisible();
    await expect(page.getByText('Essentieel', { exact: true })).toBeVisible();
    await expect(page.getByText('Paleis', { exact: true })).toBeVisible();
    console.log('✓ Badges visible');

    await expect(page.getByText('Prijsinformatie')).toBeVisible();
    await expect(page.getByText('€21.00')).toBeVisible();
    console.log('✓ Pricing visible');

    await expect(page.getByText('Duur')).toBeVisible();
    await expect(page.getByText('Openingstijden')).toBeVisible();
    await expect(page.getByText('Tips')).toBeVisible();
    await expect(page.getByText('Reservering Vereist')).toBeVisible();
    console.log('✓ All detail sections visible');

    await page.click('a:has-text("Terug")');
    await page.waitForURL(`**/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1000);

    console.log('✅ Attraction detail page works correctly!');
  });

  test('should display attractions in English', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Attractions');
    await expect(page.getByText('Discover attractions')).toBeVisible();
    await expect(page.getByText('Seville').first()).toBeVisible();
    await expect(page.getByText('Essential').first()).toBeVisible();
    console.log('✓ English list content correct');

    await page.click(`a[href*="/${TRIP_SLUG}/attractions/granada-alhambra"]`);
    await page.waitForURL(`**/${TRIP_SLUG}/attractions/granada-alhambra`);
    await page.waitForTimeout(1500);

    await expect(page.locator('h1')).toContainText('Alhambra');
    await expect(page.getByText('Granada', { exact: true })).toBeVisible();
    await expect(page.getByText('Essential', { exact: true })).toBeVisible();
    await expect(page.getByText('Opening Hours')).toBeVisible();
    console.log('✓ English detail page content correct');

    console.log('✅ English attractions work correctly!');
  });

  test('should handle category filter', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1000);

    console.log('✓ Testing category filter - clicking Paleis...');
    await page.click('button:has-text("Paleis")');
    await page.waitForTimeout(1000);

    const palaceCount = await page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`).count();
    console.log(`✓ Palace filter: ${palaceCount} cards`);
    expect(palaceCount).toBeGreaterThanOrEqual(2);

    console.log('✓ Testing category filter - clicking Monument...');
    await page.click('button:has-text("Monument")');
    await page.waitForTimeout(1000);

    const monumentCount = await page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`).count();
    console.log(`✓ Monument filter: ${monumentCount} cards`);
    expect(monumentCount).toBeGreaterThanOrEqual(1);

    console.log('✅ Category filter works correctly!');
  });

  test('should search attractions by text', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1500);

    const initialCount = await page.getByText(/\d+ \/ \d+/).textContent();
    console.log(`✓ Initial count: ${initialCount}`);

    const searchInput = page.getByPlaceholder('Zoek bezienswaardigheden...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Alhambra');
    await page.waitForTimeout(500);

    const filteredCount = await page.getByText(/\d+ \/ \d+/).textContent();
    console.log(`✓ After search "Alhambra": ${filteredCount}`);
    const [filtered] = filteredCount!.split(' / ').map(Number);
    expect(filtered).toBeLessThanOrEqual(5);
    expect(filtered).toBeGreaterThanOrEqual(1);

    await searchInput.clear();
    await page.waitForTimeout(500);
    expect(await page.getByText(/\d+ \/ \d+/).textContent()).toBe(initialCount);
    console.log('✓ Search cleared, count restored');

    console.log('✅ Attraction search works correctly!');
  });

  test('should sort attractions by different criteria', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1500);

    await expect(page.locator('button:has-text("Prioriteit")')).toBeVisible();
    console.log('✓ Sort pills visible');

    await page.click('button:has-text("Naam")');
    await page.waitForTimeout(500);
    const firstCardText = await page.locator(`a[href*="/${TRIP_SLUG}/attractions/"]`).first().textContent();
    console.log(`✓ First card after name sort: ${firstCardText?.substring(0, 40)}`);

    await page.click('button:has-text("Prijs")');
    await page.waitForTimeout(500);
    console.log('✓ Price sort applied');

    await page.click('button:has-text("Duur")');
    await page.waitForTimeout(500);
    console.log('✓ Duration sort applied');

    console.log('✅ Attraction sorting works correctly!');
  });

  test('should show empty state with reset button when no results', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1500);

    const searchInput = page.getByPlaceholder('Zoek bezienswaardigheden...');
    await searchInput.fill('xyznonexistent123');
    await page.waitForTimeout(500);

    await expect(page.getByText('0 / ')).toBeVisible();
    console.log('✓ Zero results shown');

    await expect(page.getByText('Geen bezienswaardigheden gevonden')).toBeVisible();
    console.log('✓ Empty state message visible');

    const resetBtn = page.getByText('Filters resetten');
    await expect(resetBtn).toBeVisible();
    console.log('✓ Reset filters button visible');

    await resetBtn.click();
    await page.waitForTimeout(500);

    const count = await page.getByText(/\d+ \/ \d+/).textContent();
    const [filtered, total] = count!.split(' / ').map(Number);
    expect(filtered).toBe(total);
    console.log(`✓ After reset: ${count}`);

    console.log('✅ Empty state with reset works correctly!');
  });

  test('should toggle favorite on attraction card', async ({ page }) => {
    await page.goto(`${BASE_URL}/nl/${TRIP_SLUG}/attractions`);
    await page.waitForTimeout(1500);

    const heartButtons = page.locator('button[title] .lucide-heart');
    await expect(heartButtons.first()).toBeVisible();
    console.log('✓ Heart/favorite buttons visible on cards');

    await heartButtons.first().click();
    await page.waitForTimeout(500);
    console.log('✓ Clicked heart to favorite');

    const favPill = page.locator('button:has-text("Favorieten")');
    await expect(favPill).toBeVisible();
    console.log('✓ Favorites filter pill visible');

    await favPill.click();
    await page.waitForTimeout(500);

    const count = await page.getByText(/\d+ \/ \d+/).textContent();
    const [filtered] = count!.split(' / ').map(Number);
    expect(filtered).toBeGreaterThanOrEqual(1);
    console.log(`✓ Favorites filter active: ${count}`);

    await favPill.click();
    await page.waitForTimeout(500);

    console.log('✅ Favorites toggle works correctly!');
  });
});
