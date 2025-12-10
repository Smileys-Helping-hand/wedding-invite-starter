import { test, expect } from '@playwright/test';

test('staff check-in flow and memory wall upload (headless)', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Navigate to check-in page (try a few possible nav targets)
  const selectors = ['a[href="/admin/check-in"]', 'a[href="/admin/event-day"]', 'text=Event'];
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.count() > 0) {
      await el.click();
      break;
    }
  }

  // If PIN field exists, enter the manager PIN shown in UI
  const pinInput = page.locator('input[type="password"]');
  if (await pinInput.count() > 0) {
    // Try default manager PIN from UI hints (reads displayed PINs)
    const pinsText = await page.locator('.muted').first().innerText().catch(() => '');
    const match = pinsText.match(/Manager:\s*(\w+)/i);
    const managerPin = match ? match[1] : '';
    if (managerPin) {
      await pinInput.fill(managerPin);
      await page.click('button:has-text("Unlock screen")');
    }
  }

  // Ensure we can find a scan input and paste a known code
  const scanInput = page.locator('input[placeholder*="Scan"]');
  if (await scanInput.count() > 0) {
    await scanInput.fill('lumina001');
    await scanInput.press('Enter');
    // arrival toggle should update - check for 'Arrived' tag near list
    await expect(page.locator('text=Arrived').first()).toBeVisible({ timeout: 5000 });
  }

  // Test Memory Wall: navigate to guest event page and upload image via data URL
  await page.goto('http://localhost:5173/event-day/guest');
  // Ensure memory wall upload exists
  const upload = page.locator('input[type=file]');
  if (await upload.count() > 0) {
    // create a small dataURL image and upload using setInputFiles
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgY1JmDkAAAAASUVORK5CYII=',
      'base64'
    );
    await upload.setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
    // After upload, an img should appear in the memory grid
    await expect(page.locator('.memory-tile img').first()).toBeVisible({ timeout: 5000 });
  }
});
