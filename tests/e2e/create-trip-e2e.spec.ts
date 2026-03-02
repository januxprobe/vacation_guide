import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * Helper: wait for the textarea to become enabled (streaming finished)
 */
async function waitForInputReady(page: import('@playwright/test').Page) {
  const maxWait = 180000;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const disabled = await page.locator('textarea').getAttribute('disabled');
    if (disabled === null) return;
    await page.waitForTimeout(500);
  }
  throw new Error('Textarea still disabled after 3 minutes');
}

/**
 * Helper: send a message and wait for AI to finish responding
 */
async function sendAndWaitForResponse(page: import('@playwright/test').Page, text: string) {
  await waitForInputReady(page);
  await page.fill('textarea', text);
  await page.waitForTimeout(300);
  await page.click('button:has(svg.lucide-send)');
  await page.waitForTimeout(3000);
  await waitForInputReady(page);
  await page.waitForTimeout(1500);
}

/**
 * Helper: check if the "Reis Aanmaken" button is visible
 */
async function isCreateButtonVisible(page: import('@playwright/test').Page): Promise<boolean> {
  return page.locator('button:has-text("Reis Aanmaken")').first().isVisible().catch(() => false);
}

test.describe('Create Trip with Story (E2E)', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });

  test.setTimeout(600000);

  test('should create a Rome & Venice trip via AI chat with story generation', async ({ page }) => {
    // Step 1: Trip selector
    console.log('=== Step 1: Trip Selector ===');
    await page.goto(`${BASE_URL}/nl`);
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).toContainText('Jouw Reizen');
    console.log('✓ Trip selector loaded');

    await page.click('text=Nieuwe Reis Maken');
    await page.waitForURL('**/create-trip');
    await page.waitForTimeout(1500);
    console.log('✓ Create trip page loaded');

    // Step 2: Describe the trip (Phase 1 of AI flow — gather basics)
    console.log('\n=== Step 2: Describe trip to AI ===');
    await expect(page.locator('text=reisplanner').first()).toBeVisible({ timeout: 5000 });
    console.log('✓ AI greeting visible');

    console.log('✓ Sending trip description...');
    await sendAndWaitForResponse(page,
      'Ik wil een 5-daagse reis naar Rome en Venetië plannen in mei 2027. ' +
      'We gaan met 3 volwassenen, twee meisjes van 20 jaar, en oma in een rolstoel. ' +
      'We houden van cultuur, architectuur en lekker eten. Budget is gemiddeld.'
    );
    console.log('✓ AI responded!');
    await page.waitForTimeout(2000);

    // Step 3: Confirm trip structure (Phase 2 — get AI to emit trip_config)
    console.log('\n=== Step 3: Confirm trip structure ===');
    console.log('✓ Asking AI to propose trip structure with trip_config...');
    await sendAndWaitForResponse(page,
      'Dat klinkt goed! Maak een reisstructuur voor Rome en Venetië (5 dagen). ' +
      'Geef een trip_config JSON block met de steden, data, en reizigers. ' +
      'We bezoeken Rome (3 dagen) en Venetië (2 dagen).'
    );
    console.log('✓ AI responded with trip structure!');
    await page.waitForTimeout(2000);

    // Check if trip_config was emitted (green "Trip configuration ready!" card)
    const tripConfigCard = page.locator('text=Trip configuration ready!');
    const hasTripConfig = await tripConfigCard.isVisible().catch(() => false);
    console.log(`✓ trip_config emitted: ${hasTripConfig}`);

    // If trip_config wasn't emitted yet, nudge the AI
    if (!hasTripConfig) {
      console.log('  → Nudging AI to emit trip_config...');
      await sendAndWaitForResponse(page,
        'Ja, bevestig deze reisstructuur. Genereer het trip_config JSON block met alle details: ' +
        'slug "rome-venetie-2027", data van 1-5 mei 2027, 3 volwassenen (2 studenten), steden met kleuren en coordinaten.'
      );
      await page.waitForTimeout(2000);
      const hasTripConfigNow = await tripConfigCard.isVisible().catch(() => false);
      console.log(`  ✓ trip_config emitted after nudge: ${hasTripConfigNow}`);
    }

    // Step 4: Ask for structured attraction suggestions (Phase 3)
    console.log('\n=== Step 4: Ask for structured attractions ===');
    console.log('✓ Asking for attraction suggestions...');
    await sendAndWaitForResponse(page,
      'Stel nu 5 bezienswaardigheden voor voor Rome en Venetië. ' +
      'Geef ze als JSON code blocks met type "attraction_suggestion" zodat ik ze kan accepteren. ' +
      'Gebruik echte prijzen, GPS coordinaten en categorieën.'
    );
    console.log('✓ AI responded with suggestions!');
    await page.waitForTimeout(2000);

    // Accept visible attraction suggestions one at a time
    let accepted = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const btn = page.locator('button:has-text("Accepteren"):not([disabled])').first();
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) break;

      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      accepted++;
      console.log(`  ✓ Accepted attraction ${accepted}`);
      await page.waitForTimeout(500);
    }
    console.log(`✓ Accepted ${accepted} attractions total`);

    // If no attractions were emitted as JSON, ask again more explicitly
    if (accepted === 0) {
      console.log('  → No attraction_suggestion blocks found, asking again...');
      await sendAndWaitForResponse(page,
        'Geef me alsjeblieft 5 bezienswaardigheden als JSON code blocks met exact dit format:\n' +
        '```json\n{"type": "attraction_suggestion", "data": {"id": "...", "name": "...", ...}}\n```\n' +
        'Elk in een apart JSON code block. Gebruik echte data voor Rome/Venetië.'
      );
      await page.waitForTimeout(2000);

      for (let attempt = 0; attempt < 10; attempt++) {
        const btn = page.locator('button:has-text("Accepteren"):not([disabled])').first();
        const visible = await btn.isVisible().catch(() => false);
        if (!visible) break;

        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        accepted++;
        console.log(`  ✓ Accepted attraction ${accepted}`);
        await page.waitForTimeout(500);
      }
      console.log(`✓ Accepted ${accepted} attractions total (after retry)`);
    }
    await page.waitForTimeout(2000);

    // Step 5: Create the trip
    console.log('\n=== Step 5: Create Trip ===');
    const createButton = page.locator('button:has-text("Reis Aanmaken")');

    // Wait for the button to appear — it requires all readiness flags + trip_config
    let buttonVisible = await isCreateButtonVisible(page);
    if (!buttonVisible) {
      console.log('  → Create button not yet visible, sending readiness nudge...');
      await sendAndWaitForResponse(page,
        'Ik heb genoeg informatie. Genereer het trip_config JSON block als je dat nog niet hebt gedaan, ' +
        'en het trip_ready block met alle velden op true. Ik wil de reis nu aanmaken.'
      );
      await page.waitForTimeout(3000);
      buttonVisible = await isCreateButtonVisible(page);
    }

    if (!buttonVisible) {
      // Last resort: check if we can see the green "Trip configuration ready!" badge
      console.log('  → Still not visible. Checking page state...');
      const allText = await page.locator('.border-l.border-gray-200.bg-gray-50').textContent();
      console.log(`  Sidebar content: ${allText?.slice(0, 200)}`);
    }

    await expect(createButton.first()).toBeVisible({ timeout: 15000 });
    console.log('✓ "Reis Aanmaken" button visible');

    await createButton.first().click();
    console.log('✓ Clicked - AI is finalizing trip data (this can take a minute)...');

    // Wait for redirect to the new trip page
    try {
      await page.waitForURL(/\/(?:nl|en)\/(?!create-trip).*/, { timeout: 180000 });
      console.log(`✓ Redirected to: ${page.url()}`);
    } catch {
      console.log('⚠ No redirect detected');
      console.log(`  Current URL: ${page.url()}`);
      const lastMessages = await page.locator('.rounded-2xl').allTextContents();
      const lastMsg = lastMessages[lastMessages.length - 1] || '';
      if (lastMsg.includes('Details:')) {
        console.log(`  Error from app: ${lastMsg}`);
      }
    }
    await page.waitForTimeout(4000);

    // Extract the trip slug from the redirect URL
    const currentUrl = page.url();
    const tripSlug = currentUrl.replace(`${BASE_URL}/nl/`, '').replace(/\/.*$/, '');
    console.log(`✓ Trip slug: ${tripSlug}`);

    // Step 6: Verify restaurants were generated
    console.log('\n=== Step 6: Verify generated restaurants ===');
    await page.goto(`${BASE_URL}/nl/${tripSlug}/restaurants`);
    await page.waitForTimeout(2000);

    await expect(page.locator('h1')).toContainText('Restaurants');
    console.log('✓ Restaurants page loaded');

    const restaurantCounter = page.getByText(/\d+ \/ \d+/);
    await expect(restaurantCounter).toBeVisible({ timeout: 5000 });
    const counterText = await restaurantCounter.textContent();
    const totalMatch = counterText?.match(/(\d+) \/ (\d+)/);
    const restaurantCount = totalMatch ? parseInt(totalMatch[2]) : 0;
    console.log(`✓ Restaurants generated: ${restaurantCount}`);
    expect(restaurantCount).toBeGreaterThan(0);

    await expect(page.getByText('Restaurants Zoeken')).toBeVisible({ timeout: 3000 });
    console.log('✓ Restaurant search UI visible (dynamic trip)');

    const trashButtons = page.locator('.grid button:has(svg.lucide-trash-2)');
    const trashCount = await trashButtons.count();
    console.log(`✓ Remove buttons visible: ${trashCount}`);
    expect(trashCount).toBeGreaterThan(0);

    // Step 7: Verify planner page loads
    console.log('\n=== Step 7: Verify planner page ===');
    await page.goto(`${BASE_URL}/nl/${tripSlug}/planner`);
    await page.waitForTimeout(3000);

    const dayTabs = page.locator('button:has-text("Dag")');
    await expect(dayTabs.first()).toBeVisible({ timeout: 10000 });
    const dayCount = await dayTabs.count();
    console.log(`✓ Itinerary generated with ${dayCount} day tabs`);
    expect(dayCount).toBeGreaterThan(0);

    // Step 8: Verify budget page loads
    console.log('\n=== Step 8: Verify budget page ===');
    await page.goto(`${BASE_URL}/nl/${tripSlug}/budget`);
    await page.waitForTimeout(2000);

    await expect(page.locator('h1')).toContainText('Budget Calculator');
    console.log('✓ Budget page loaded');

    const hasBudgetData = !(await page.getByText('Geen budget beschikbaar').isVisible().catch(() => false));
    expect(hasBudgetData).toBe(true);
    console.log('✓ Budget has data');

    // Step 9: Generate story on trip homepage
    console.log('\n=== Step 9: Generate trip story ===');
    await page.goto(`${BASE_URL}/nl/${tripSlug}`);
    await page.waitForTimeout(3000);

    // The story section should show the style picker (no story generated yet)
    const storyTitle = page.getByRole('heading', { name: 'Reisverhaal' });
    await expect(storyTitle).toBeVisible({ timeout: 10000 });
    console.log('✓ Story section visible with style picker');

    // Pick "Avontuurlijk" (adventure) style — it's selected by default, just verify
    const adventureButton = page.getByText('Avontuurlijk');
    await expect(adventureButton).toBeVisible({ timeout: 5000 });
    console.log('✓ Adventure style option visible');

    // Click "Verhaal Genereren"
    const generateButton = page.getByText('Verhaal Genereren');
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();
    console.log('✓ Clicked "Verhaal Genereren" — generating story (this can take a minute)...');

    // Wait for the generating spinner to appear and then disappear
    await expect(page.getByText('Verhaal wordt geschreven...')).toBeVisible({ timeout: 10000 });
    console.log('✓ Generating spinner visible');

    // Wait for story to appear (generation can take up to 2 minutes)
    await expect(page.getByText('Gegenereerd op')).toBeVisible({ timeout: 180000 });
    console.log('✓ Story generated successfully!');

    // Verify story chapters exist (each chapter has class .story-chapter)
    const chapters = page.locator('.story-chapter');
    const chapterCount = await chapters.count();
    console.log(`✓ Story has ${chapterCount} chapters`);
    expect(chapterCount).toBeGreaterThan(0);

    // Verify story actions (regenerate button) are visible
    const regenerateButton = page.getByText('Opnieuw Genereren');
    await expect(regenerateButton).toBeVisible({ timeout: 5000 });
    console.log('✓ Story actions visible (Regenerate button)');

    // Step 10: Verify on trip selector
    console.log('\n=== Step 10: Verify trip on selector ===');
    await page.goto(`${BASE_URL}/nl`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const deleteButtons = page.locator('button:has(svg.lucide-trash-2)');
    const deleteCount = await deleteButtons.count();
    console.log(`✓ Delete buttons found: ${deleteCount} (user-created trips)`);
    expect(deleteCount).toBeGreaterThan(0);
    console.log('✓ Trip visible on selector with delete option');

    await page.waitForTimeout(2000);
    console.log('\n✅ Full create → verify → story flow completed! Trip kept for manual review.');
  });
});
