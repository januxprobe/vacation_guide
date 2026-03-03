import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const DIR = 'docs/screenshots';
const TRIP = 'andalusia-2026';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. AI Chat — send a message so it shows a real conversation
  console.log('📸 AI Chat...');
  await page.goto(`${BASE}/en/create-trip`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const input = page.getByPlaceholder('Describe your dream trip...');
  await input.fill('I want to plan a 5-day trip to Barcelona in July 2027 for 2 adults. We love architecture and great food!');
  await input.press('Enter');
  // Wait for AI to start responding
  await page.waitForTimeout(15000);
  await page.screenshot({ path: `${DIR}/ai-chat.png`, fullPage: false });

  // 2. Trip Homepage (viewport only — hero + stats)
  console.log('📸 Trip Homepage...');
  await page.goto(`${BASE}/en/${TRIP}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/trip-homepage.png`, fullPage: false });

  // 3. Planner Map
  console.log('📸 Planner Map...');
  await page.goto(`${BASE}/en/${TRIP}/planner`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${DIR}/planner-map.png`, fullPage: false });

  // 4. Budget Calculator
  console.log('📸 Budget Calculator...');
  await page.goto(`${BASE}/en/${TRIP}/budget`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/budget-calculator.png`, fullPage: false });

  await browser.close();
  console.log('✅ All screenshots saved to docs/screenshots/');
}

main().catch(console.error);
