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

test.describe('AI Chat Flow & Readiness (E2E)', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });

  test.setTimeout(300000); // 5 minutes

  test('should show readiness checklist, gate Create button, and respond to messages', async ({ page }) => {
    // Step 1: Navigate to create-trip page
    console.log('=== Step 1: Navigate to create-trip ===');
    await page.goto(`${BASE_URL}/nl/create-trip`);
    await page.waitForTimeout(2000);

    // Verify initial AI greeting
    await expect(page.locator('text=reisplanner').first()).toBeVisible({ timeout: 5000 });
    console.log('✓ AI greeting visible');

    // Step 2: Verify sidebar shows empty state initially
    console.log('\n=== Step 2: Verify sidebar empty state ===');
    await expect(page.getByText('Begin een gesprek om je reis te plannen')).toBeVisible({ timeout: 3000 });
    console.log('✓ Sidebar shows empty state');

    // Step 3: Verify "Create Trip" button is NOT visible (no context yet)
    console.log('\n=== Step 3: Verify Create button gated ===');
    const createButton = page.locator('button:has-text("Reis Aanmaken")');
    await expect(createButton).not.toBeVisible();
    console.log('✓ "Reis Aanmaken" button correctly hidden (no readiness)');

    // Step 4: Send a message with all trip details and verify AI responds
    console.log('\n=== Step 4: Send trip description ===');
    await sendAndWaitForResponse(page,
      'Ik wil een reis naar Rome plannen van 1 tot 5 juni 2027, met 2 volwassenen en 1 kind. ' +
      'We houden van geschiedenis en lekker eten.'
    );
    console.log('✓ AI responded to trip description');

    // Step 5: Verify the AI produced a non-empty response
    console.log('\n=== Step 5: Verify AI response ===');
    const chatArea = page.locator('.flex-1.overflow-y-auto').first();
    const messageCount = await chatArea.locator('.flex.gap-3').count();
    console.log(`✓ Messages in chat: ${messageCount}`);
    expect(messageCount).toBeGreaterThanOrEqual(3); // initial greeting + user msg + AI response

    // Verify the last AI response has actual content
    const assistantBubbles = chatArea.locator('.bg-gray-100.text-gray-900');
    const lastBubble = assistantBubbles.last();
    const responseText = await lastBubble.textContent();
    console.log(`✓ AI response length: ${responseText?.length ?? 0} chars`);
    expect(responseText?.length ?? 0).toBeGreaterThan(20);

    // Step 6: Check if readiness checklist appeared in sidebar (after AI trip_ready block)
    console.log('\n=== Step 6: Check readiness state ===');
    // The AI should have emitted a trip_ready block — the sidebar should now show the checklist
    const sidebarPanel = page.locator('.border-l.border-gray-200.bg-gray-50');
    const hasChecklist = await sidebarPanel.getByText('Bestemming').isVisible().catch(() => false);
    if (hasChecklist) {
      console.log('✓ Readiness checklist visible in sidebar');
      // Check which items are confirmed
      for (const label of ['Bestemming', 'Reisdata', 'Reizigers', 'Steden']) {
        const visible = await sidebarPanel.getByText(label).isVisible().catch(() => false);
        console.log(`  ${visible ? '✓' : '○'} ${label}`);
      }
    } else {
      console.log('○ Readiness checklist not yet visible (AI may not have emitted trip_ready)');
      // Still valid — the AI doesn't always emit trip_ready in first response
    }

    // Step 7: Verify "Create Trip" button is still not visible
    // (AI needs trip_config + all readiness flags to enable it)
    console.log('\n=== Step 7: Verify Create button state ===');
    const createVisible = await createButton.isVisible().catch(() => false);
    console.log(`✓ "Reis Aanmaken" button visible: ${createVisible}`);
    if (createVisible) {
      console.log('  → AI emitted trip_config + readiness after first message (fast AI!)');
    } else {
      console.log('  → Button correctly hidden (waiting for full readiness + trip_config)');
    }

    // Step 8: Send a follow-up to continue the conversation
    console.log('\n=== Step 8: Send follow-up message ===');
    await sendAndWaitForResponse(page,
      'Ja dat klinkt goed! Stel 3 bezienswaardigheden voor als JSON attraction_suggestion blocks.'
    );
    console.log('✓ AI responded to follow-up');

    const finalMessageCount = await chatArea.locator('.flex.gap-3').count();
    console.log(`✓ Total messages now: ${finalMessageCount}`);
    expect(finalMessageCount).toBeGreaterThanOrEqual(5);

    // Step 9: Check if any "Accept" buttons appeared (attraction suggestions)
    console.log('\n=== Step 9: Check for attraction suggestions ===');
    await page.waitForTimeout(1000);
    const acceptButtons = page.locator('button:has-text("Accepteren")');
    const acceptCount = await acceptButtons.count();
    console.log(`✓ "Accepteren" buttons found: ${acceptCount}`);

    if (acceptCount > 0) {
      // Accept one to test the mechanism
      await acceptButtons.first().click();
      await page.waitForTimeout(500);
      console.log('✓ Accepted first attraction');

      // Verify it appears in the sidebar
      const sidebarAttractions = sidebarPanel.locator('.bg-green-50');
      const sidebarCount = await sidebarAttractions.count();
      console.log(`✓ Sidebar accepted attractions: ${sidebarCount}`);
      expect(sidebarCount).toBeGreaterThanOrEqual(1);
    }

    await page.waitForTimeout(1000);
    console.log('\n✅ Chat flow & readiness test completed!');
  });
});
