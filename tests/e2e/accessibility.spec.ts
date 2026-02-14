import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

test('no serious or critical accessibility violations on initial view', async ({ page }) => {
  await page.goto('/');

  const analysis = await new AxeBuilder({ page })
    .exclude('canvas')
    .analyze();

  const highImpactViolations = analysis.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical'
  );

  expect(highImpactViolations).toEqual([]);
});
