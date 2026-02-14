import { test, expect, type Page } from '@playwright/test';

type StoredMaterial = { name?: string };

function makeSeedMaterial(id: string, name: string) {
  const now = Date.now();
  return {
    id,
    name,
    color: '#ffffff',
    metalness: 0.5,
    roughness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 0,
    clearcoat: 0,
    clearcoatRoughness: 0.03,
    transmission: 0,
    ior: 1.5,
    opacity: 1,
    createdAt: now,
    updatedAt: now,
  };
}

async function clearMaterials(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('materialExplorerOnboardingSeen', 'true');
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

test('rejects import files with too many materials', async ({ page }) => {
  const tooManyMaterialsPayload = {
    version: 1,
    materials: Array.from({ length: 601 }, (_, index) => makeSeedMaterial(`bulk-${index}`, `Bulk ${index}`)),
  };
  const dialogPromise = page.waitForEvent('dialog');

  await page
    .locator('input[type="file"][accept="application/json,.json"]')
    .setInputFiles({
      name: 'too-many-materials.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(tooManyMaterialsPayload), 'utf8'),
    });

  const dialog = await dialogPromise;
  expect(dialog.message()).toContain('too many materials');
  await dialog.accept();

  await expect
    .poll(async () => {
      const materials = await page.evaluate(() => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]);
      return materials.length;
    })
    .toBe(0);
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

test('can undo and redo draft changes with shortcuts', async ({ page }) => {
  const roughnessValue = page.locator('input#roughness-value');
  await roughnessValue.fill('0.2');
  await expect(roughnessValue).toHaveValue('0.2');

  await page.getByText('Live Material Lab').click();
  await page.keyboard.press('ControlOrMeta+KeyZ');
  await expect(roughnessValue).toHaveValue('0.5');

  await page.keyboard.press('ControlOrMeta+Shift+KeyZ');
  await expect(roughnessValue).toHaveValue('0.2');
});

test('can toggle compare mode after capturing reference', async ({ page }) => {
  const compareButton = page.getByRole('button', { name: 'Compare', exact: true });
  await expect(compareButton).toBeDisabled();

  await page.getByRole('button', { name: 'Set A' }).click();
  const hideCompareButton = page.getByRole('button', { name: 'Hide Compare', exact: true });
  await expect(hideCompareButton).toBeVisible();

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find((node) => node.textContent?.trim() === 'Hide Compare');
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await expect(compareButton).toBeVisible();
});

test('can bulk favorite selected materials', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((payload) => {
    window.localStorage.setItem('materials', JSON.stringify(payload));
  }, [makeSeedMaterial('seed-1', 'Seed One'), makeSeedMaterial('seed-2', 'Seed Two')]);
  await page.reload();

  await page.getByRole('button', { name: 'Enable bulk selection' }).click();
  await page.evaluate(() => {
    const button = document.querySelector('button[aria-label=\"Select material\"]') as HTMLButtonElement | null;
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await expect(page.locator('text=Selected:').first()).toContainText('1');
  const bulkFavoriteButton = page.getByRole('button', { name: 'Favorite', exact: true });
  await expect(bulkFavoriteButton).toBeEnabled();
  await bulkFavoriteButton.click();

  await expect
    .poll(async () => {
      const materials = await page.evaluate(() => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as Array<{ favorite?: boolean }>);
      return materials.filter((material) => material.favorite).length;
    })
    .toBe(1);
});

test('can export materials as JSON', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((payload) => {
    window.localStorage.setItem('materials', JSON.stringify(payload));
  }, [makeSeedMaterial('seed-1', 'Seed Export')]);
  await page.reload();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export JSON' }).click(),
  ]);

  expect(download.suggestedFilename()).toBe('materials.json');
});
