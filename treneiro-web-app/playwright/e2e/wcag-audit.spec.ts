import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';

test.describe('WCAG Accessibility Audit', () => {
  const pagesToAudit = [
    { name: 'Home_Dashboard', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Categories', path: '/categories' },
    { name: 'Tags', path: '/tags' }
  ];

  const allViolations: any = {};

  test.afterAll(() => {
    fs.writeFileSync('./tmp_wcag_results.json', JSON.stringify(allViolations, null, 2));
  });

  for (const p of pagesToAudit) {
    test(`Auditing ${p.name}`, async ({ page }) => {
      await page.goto(`http://localhost:5173${p.path}`);
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .disableRules(['color-contrast'])
        .analyze();
        
      allViolations[p.name] = accessibilityScanResults.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.map(n => n.target.join(' '))
      }));
    });
  }
});
