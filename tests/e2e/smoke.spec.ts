import { test, expect, type Page } from '@playwright/test';

type StoredMaterial = { name?: string };

async function clearMaterials(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
}

test.beforeEach(async ({ page }) => {
  await clearMaterials(page);
});

test('can create a material', async ({ page }) => {
  await page.locator('input[name="name"]').fill('Smoke Material');
  await page.getByRole('button', { name: 'Save Material' }).click();

  await expect
    .poll(async () => {
      const materials = await page.evaluate(() => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]);
      return materials.length;
    })
    .toBe(1);

  await expect
    .poll(async () => {
      const materials = await page.evaluate(() => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]);
      return materials[0]?.name;
    })
    .toBe('Smoke Material');
});

test('can import materials from JSON', async ({ page }) => {
  const payload = {
    version: 1,
    materials: [
      {
        id: 'import-smoke-1',
        name: 'Imported Smoke',
        color: '#ffcc00',
        metalness: 0.6,
        roughness: 0.25,
        emissive: '#000000',
        emissiveIntensity: 0,
        clearcoat: 0.1,
        clearcoatRoughness: 0.05,
        transmission: 0,
        ior: 1.5,
        opacity: 1,
        createdAt: Date.now(),
      },
    ],
  };

  await page
    .locator('input[type="file"][accept="application/json,.json"]')
    .setInputFiles({
      name: 'materials.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(payload), 'utf8'),
    });

  await expect
    .poll(async () => {
      const materials = await page.evaluate(() => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]);
      return materials.some((m) => m.name === 'Imported Smoke');
    })
    .toBe(true);
});

test('can save a material with keyboard shortcut', async ({ page }) => {
  await page.locator('input[name="name"]').fill('Shortcut Material');
  await page.keyboard.press('ControlOrMeta+KeyS');

  await expect
    .poll(async () => {
      const materials = await page.evaluate(() => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]);
      return materials.length;
    })
    .toBe(1);

  await expect
    .poll(async () => {
      const materials = await page.evaluate(() => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]);
      return materials[0]?.name;
    })
    .toBe('Shortcut Material');
});
