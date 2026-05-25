import { test, expect, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';

type StoredMaterial = { name?: string; tags?: string[] };
const PNG_CRC_TABLE = createCrcTable();

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

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc >>> 0;
  }
  return table;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    const byte = buffer[index];
    crc = PNG_CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function createSolidPng(width: number, height: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const row = Buffer.alloc(width * 4 + 1);
  for (let offset = 1; offset < row.length; offset += 4) {
    row[offset] = 70;
    row[offset + 1] = 120;
    row[offset + 2] = 180;
    row[offset + 3] = 255;
  }

  const raw = Buffer.alloc(row.length * height);
  for (let y = 0; y < height; y += 1) {
    row.copy(raw, y * row.length);
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function clearMaterials(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('materialExplorerOnboardingSeen', 'true');
    window.localStorage.setItem('materialExplorerCardPreview3d', 'true');
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
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
      return materials.length;
    })
    .toBe(1);

  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
      return materials[0]?.name;
    })
    .toBe('Smoke Material');
});

test('enforces material name max length before save', async ({ page }) => {
  const overlongName = 'N'.repeat(180);
  const expected = 'N'.repeat(120);
  const nameInput = page.locator('input[name="name"]');

  await nameInput.fill(overlongName);
  await expect(nameInput).toHaveValue(expected);
  await expect(page.getByText('120/120 characters')).toBeVisible();

  await page.getByRole('button', { name: 'Save Material' }).click();

  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
      return materials[0]?.name;
    })
    .toBe(expected);
});

test('sanitizes and limits tags before save', async ({ page }) => {
  const overlongTag = 't'.repeat(70);
  const tagsInput = [overlongTag, 'dup', 'dup', ...Array.from({ length: 40 }, (_, index) => `tag-${index}`)].join(', ');

  await page.locator('#material-tags').fill(tagsInput);
  await expect(page.getByText('32/32 tags')).toBeVisible();
  await page.getByRole('button', { name: 'Save Material' }).click();

  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
      const tags = materials[0]?.tags ?? [];
      const duplicateCount = tags.filter((tag) => tag === 'dup').length;
      return `${tags.length}|${tags[0]?.length ?? 0}|${duplicateCount}`;
    })
    .toBe('32|40|1');
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

  await page.locator('input[type="file"][accept="application/json,.json"]').setInputFiles({
    name: 'materials.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload), 'utf8'),
  });

  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
      return materials.some((m) => m.name === 'Imported Smoke');
    })
    .toBe(true);
});

test('warns and clears invalid share payloads', async ({ page }) => {
  await page.goto('/?m=%%%bad%%%');
  await expect(page.getByText('Share link invalid', { exact: true })).toBeVisible();
  await expect.poll(() => page.url()).not.toContain('?m=');
});

test('rejects import files with too many materials', async ({ page }) => {
  const tooManyMaterialsPayload = {
    version: 1,
    materials: Array.from({ length: 601 }, (_, index) => makeSeedMaterial(`bulk-${index}`, `Bulk ${index}`)),
  };

  await page.locator('input[type="file"][accept="application/json,.json"]').setInputFiles({
    name: 'too-many-materials.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(tooManyMaterialsPayload), 'utf8'),
  });

  await expect(page.getByText('Import blocked', { exact: true })).toBeVisible();
  await expect(page.getByText(/too many materials/i)).toBeVisible();

  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
      return materials.length;
    })
    .toBe(0);
});

test('can save a material with keyboard shortcut', async ({ page }) => {
  await page.locator('input[name="name"]').fill('Shortcut Material');
  await page.keyboard.press('ControlOrMeta+KeyS');

  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
      return materials.length;
    })
    .toBe(1);

  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
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

  await page.keyboard.press('ControlOrMeta+KeyY');
  await expect(roughnessValue).toHaveValue('0.2');
});

test('shows unsaved state and can revert draft changes', async ({ page }) => {
  const nameInput = page.locator('input[name="name"]');
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();

  await nameInput.fill('Transient Draft');
  await expect(page.getByText('Unsaved changes', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Revert' }).click();
  await expect(nameInput).toHaveValue('Untitled');
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();
});

test('can reset just the surface section', async ({ page }) => {
  const roughnessValue = page.locator('input#roughness-value');
  await roughnessValue.fill('0.2');
  await expect(roughnessValue).toHaveValue('0.2');

  await page.getByRole('button', { name: 'Reset Surface' }).click();
  await expect(roughnessValue).toHaveValue('0.5');
});

test('command palette shows recently used commands', async ({ page }) => {
  await page.getByRole('button', { name: 'Commands' }).click();
  const dialog = page.getByRole('dialog', { name: 'Command palette' });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: /Toggle 3D Preview/ }).click();
  await expect(dialog).not.toBeVisible();

  await page.getByRole('button', { name: 'Commands' }).click();
  await expect(dialog).toBeVisible();

  const togglePreviewRow = dialog.getByRole('button', { name: /Toggle 3D Preview/ }).first();
  await expect(togglePreviewRow).toContainText('Recent');
});

test('can toggle 3D thumbnail preference', async ({ page }) => {
  const disableButton = page.getByRole('button', { name: 'Disable 3D thumbnails' });
  await disableButton.click();

  await expect(page.getByRole('button', { name: 'Enable 3D thumbnails' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('materialExplorerCardPreview3d')))
    .toBe('false');
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
  await page.evaluate(
    (payload) => {
      window.localStorage.setItem('materials', JSON.stringify(payload));
    },
    [makeSeedMaterial('seed-1', 'Seed One'), makeSeedMaterial('seed-2', 'Seed Two')]
  );
  await page.reload();

  await page.getByRole('button', { name: 'Enable bulk selection' }).click();
  await page.evaluate(() => {
    const button = document.querySelector('button[aria-label="Select material"]') as HTMLButtonElement | null;
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await expect(page.locator('text=Selected:').first()).toContainText('1');
  const bulkFavoriteButton = page.getByRole('button', { name: 'Favorite', exact: true });
  await expect(bulkFavoriteButton).toBeEnabled();
  await bulkFavoriteButton.click();

  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as Array<{ favorite?: boolean }>
      );
      return materials.filter((material) => material.favorite).length;
    })
    .toBe(1);
});

test('bulk delete uses confirmation dialog before removing materials', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(
    (payload) => {
      window.localStorage.setItem('materials', JSON.stringify(payload));
    },
    [makeSeedMaterial('seed-1', 'Seed One'), makeSeedMaterial('seed-2', 'Seed Two')]
  );
  await page.reload();

  await page.getByRole('button', { name: 'Enable bulk selection' }).click();
  await page.evaluate(() => {
    const button = document.querySelector('button[aria-label="Select material"]') as HTMLButtonElement | null;
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

  const bulkDeleteButton = page.getByRole('button', { name: 'Delete', exact: true }).first();
  await expect(bulkDeleteButton).toBeEnabled();
  await bulkDeleteButton.click();

  const confirmDialog = page.getByRole('dialog', { name: 'Delete 1 material?' });
  await expect(confirmDialog).toBeVisible();
  await expect(confirmDialog.getByText('This action cannot be undone.')).toBeVisible();
  await confirmDialog.getByRole('button', { name: 'Cancel', exact: true }).click();

  await expect(confirmDialog).not.toBeVisible();
  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
      return materials.length;
    })
    .toBe(2);

  await bulkDeleteButton.click();
  await expect(confirmDialog).toBeVisible();
  await confirmDialog.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect
    .poll(async () => {
      const materials = await page.evaluate(
        () => JSON.parse(window.localStorage.getItem('materials') ?? '[]') as StoredMaterial[]
      );
      return materials.length;
    })
    .toBe(1);
});

test('rejects non-image texture uploads with clear feedback', async ({ page }) => {
  const textureInput = page.locator('input[type="file"][accept="image/*"]').first();
  await textureInput.setInputFiles({
    name: 'not-image.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"not":"an-image"}', 'utf8'),
  });

  await expect(page.getByText('Texture upload blocked', { exact: true })).toBeVisible();
  await expect(page.getByText('Only image files can be used as texture maps.')).toBeVisible();
});

test('rejects texture uploads beyond the hard source cap with clear feedback', async ({ page }) => {
  const textureInput = page.locator('input[type="file"][accept="image/*"]').first();
  await textureInput.setInputFiles({
    name: 'oversized-texture.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(16 * 1024 * 1024 + 1, 7),
  });

  await expect(page.getByText('Texture upload blocked', { exact: true })).toBeVisible();
  await expect(page.getByText('Texture source file is too large. Maximum supported size is 16 MB.')).toBeVisible();
});

test('shows embedded texture storage after upload', async ({ page }) => {
  const onePixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axk6FoAAAAASUVORK5CYII=',
    'base64'
  );
  const textureInput = page.locator('input[type="file"][accept="image/*"]').first();

  await expect(page.getByTestId('texture-storage-summary')).toContainText('No embedded textures');
  await textureInput.setInputFiles({
    name: 'one-pixel.png',
    mimeType: 'image/png',
    buffer: onePixelPng,
  });

  await expect(page.getByTestId('texture-storage-summary')).toContainText('embedded across 1 map');
});

test('downscales oversized valid texture uploads before storage', async ({ page }) => {
  const largePng = createSolidPng(3072, 1536);
  const textureInput = page.locator('input[type="file"][accept="image/*"]').first();

  await textureInput.setInputFiles({
    name: 'large-valid-texture.png',
    mimeType: 'image/png',
    buffer: largePng,
  });

  await expect(page.getByText('Texture optimized', { exact: true })).toBeVisible();
  await expect(page.getByText(/Downscaled from 3072x1536 to 2048x1024/)).toBeVisible();
  await expect(page.getByTestId('texture-storage-summary')).toContainText('embedded across 1 map');
});

test('can export materials as JSON', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(
    (payload) => {
      window.localStorage.setItem('materials', JSON.stringify(payload));
    },
    [makeSeedMaterial('seed-1', 'Seed Export')]
  );
  await page.reload();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export JSON' }).click(),
  ]);

  expect(download.suggestedFilename()).toBe('materials.json');
});
