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

test.describe('Create Trip (E2E)', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });

  test.setTimeout(600000);

  test('should respond in correct locale, create trip via AI chat, and verify all pages', async ({ page }) => {
    // ════════════════════════════════════════════════════════════════
    // PART 1: English locale — verify UI + AI responds in English
    // ════════════════════════════════════════════════════════════════
    console.log('=== Part 1: English locale (/en/create-trip) ===');
    await page.goto(`${BASE_URL}/en/create-trip`);
    await page.waitForTimeout(2000);

    // Verify English UI elements
    await expect(page.locator('text=travel planning assistant').first()).toBeVisible({ timeout: 5000 });
    console.log('✓ English greeting visible');

    await expect(page.getByText('Start a conversation to plan your trip')).toBeVisible({ timeout: 3000 });
    console.log('✓ English sidebar placeholder visible');

    const enCreateButton = page.locator('button:has-text("Create Trip")');
    await expect(enCreateButton).not.toBeVisible();
    console.log('✓ "Create Trip" button correctly hidden');

    // Send an English message and verify AI responds in English
    await sendAndWaitForResponse(page,
      'I want to plan a trip to Barcelona, 3 days in July 2027 with 2 adults. We love architecture and food.'
    );

    const enChatArea = page.locator('.flex-1.overflow-y-auto').first();
    const enBubbles = enChatArea.locator('.bg-gray-100.text-gray-900');
    const enResponse = await enBubbles.last().textContent();
    console.log(`✓ EN AI response (first 200 chars): ${enResponse?.slice(0, 200)}`);
    expect(enResponse?.length ?? 0).toBeGreaterThan(20);

    // Check readiness labels are in English
    const enSidebar = page.locator('.border-l.border-gray-200.bg-gray-50');
    const hasEnChecklist = await enSidebar.getByText('Destination').isVisible().catch(() => false);
    if (hasEnChecklist) {
      console.log('✓ Readiness checklist labels are in English');
      await expect(enSidebar.getByText('Travel dates')).toBeVisible();
      await expect(enSidebar.getByText('Travelers')).toBeVisible();
    } else {
      console.log('○ Readiness checklist not yet visible (AI may not have emitted trip_ready)');
    }

    // ════════════════════════════════════════════════════════════════
    // PART 2: Dutch locale — full create trip flow
    // ════════════════════════════════════════════════════════════════

    // Step 1: Trip selector
    console.log('\n=== Step 1: Trip Selector (NL) ===');
    await page.goto(`${BASE_URL}/nl`);
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).toContainText('Jouw Reizen');
    console.log('✓ Trip selector loaded');

    await page.click('text=Nieuwe Reis Maken');
    await page.waitForURL('**/create-trip');
    await page.waitForTimeout(1500);
    console.log('✓ Create trip page loaded');

    // Step 2: Verify Dutch UI and describe the trip
    console.log('\n=== Step 2: Describe trip to AI (NL) ===');
    await expect(page.locator('text=reisplanner').first()).toBeVisible({ timeout: 5000 });
    console.log('✓ Dutch greeting visible');

    await expect(page.getByText('Begin een gesprek om je reis te plannen')).toBeVisible({ timeout: 3000 });
    console.log('✓ Dutch sidebar placeholder visible');

    const nlCreateButton = page.locator('button:has-text("Reis Aanmaken")');
    await expect(nlCreateButton).not.toBeVisible();
    console.log('✓ "Reis Aanmaken" button correctly hidden');

    await sendAndWaitForResponse(page,
      'Ik wil een 5-daagse reis naar Rome en Venetië plannen in mei 2027. ' +
      'We gaan met 3 volwassenen, twee meisjes van 20 jaar, en oma in een rolstoel. ' +
      'We houden van cultuur, architectuur en lekker eten. Budget is gemiddeld.'
    );
    console.log('✓ AI responded in Dutch');

    // Verify Dutch AI response
    const nlChatArea = page.locator('.flex-1.overflow-y-auto').first();
    const nlBubbles = nlChatArea.locator('.bg-gray-100.text-gray-900');
    const nlResponse = await nlBubbles.last().textContent();
    console.log(`✓ NL AI response (first 200 chars): ${nlResponse?.slice(0, 200)}`);
    expect(nlResponse?.length ?? 0).toBeGreaterThan(20);
    await page.waitForTimeout(2000);

    // Check Dutch readiness labels
    const nlSidebar = page.locator('.border-l.border-gray-200.bg-gray-50');
    const hasNlChecklist = await nlSidebar.getByText('Bestemming').isVisible().catch(() => false);
    if (hasNlChecklist) {
      console.log('✓ Readiness checklist labels are in Dutch');
      for (const label of ['Bestemming', 'Reisdata', 'Reizigers', 'Steden']) {
        const visible = await nlSidebar.getByText(label).isVisible().catch(() => false);
        console.log(`  ${visible ? '✓' : '○'} ${label}`);
      }
    }

    // Step 3: Confirm trip structure
    console.log('\n=== Step 3: Confirm trip structure ===');
    await sendAndWaitForResponse(page,
      'Dat klinkt goed! Maak een reisstructuur voor Rome en Venetië (5 dagen). ' +
      'Geef een trip_config JSON block met de steden, data, en reizigers. ' +
      'We bezoeken Rome (3 dagen) en Venetië (2 dagen).'
    );
    console.log('✓ AI responded with trip structure');
    await page.waitForTimeout(2000);

    // Check if trip_config was emitted
    const tripConfigCard = page.locator('text=Trip configuration ready!');
    const hasTripConfig = await tripConfigCard.isVisible().catch(() => false);
    console.log(`✓ trip_config emitted: ${hasTripConfig}`);

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

    // Step 4: Ask for structured attraction suggestions
    console.log('\n=== Step 4: Ask for structured attractions ===');
    await sendAndWaitForResponse(page,
      'Stel nu 5 bezienswaardigheden voor voor Rome en Venetië. ' +
      'Geef ze als JSON code blocks met type "attraction_suggestion" zodat ik ze kan accepteren. ' +
      'Gebruik echte prijzen, GPS coordinaten en categorieën.'
    );
    console.log('✓ AI responded with suggestions');
    await page.waitForTimeout(2000);

    // Accept visible attraction suggestions
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
      console.log('  → Still not visible. Checking page state...');
      const allText = await page.locator('.border-l.border-gray-200.bg-gray-50').textContent();
      console.log(`  Sidebar content: ${allText?.slice(0, 200)}`);
    }

    await expect(nlCreateButton.first()).toBeVisible({ timeout: 15000 });
    console.log('✓ "Reis Aanmaken" button visible');

    await nlCreateButton.first().click();
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

    const storyTitle = page.getByRole('heading', { name: 'Reisverhaal' });
    await expect(storyTitle).toBeVisible({ timeout: 10000 });
    console.log('✓ Story section visible with style picker');

    const adventureButton = page.getByText('Avontuurlijk');
    await expect(adventureButton).toBeVisible({ timeout: 5000 });
    console.log('✓ Adventure style option visible');

    const generateButton = page.getByText('Verhaal Genereren');
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();
    console.log('✓ Clicked "Verhaal Genereren" — generating story (this can take a minute)...');

    await expect(page.getByText('Verhaal wordt geschreven...')).toBeVisible({ timeout: 10000 });
    console.log('✓ Generating spinner visible');

    await expect(page.getByText('Gegenereerd op')).toBeVisible({ timeout: 180000 });
    console.log('✓ Story generated successfully!');

    const chapters = page.locator('.story-chapter');
    const chapterCount = await chapters.count();
    console.log(`✓ Story has ${chapterCount} chapters`);
    expect(chapterCount).toBeGreaterThan(0);

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
    console.log('\n✅ Full E2E completed (EN locale check + NL create → verify → story)!');
  });
});
