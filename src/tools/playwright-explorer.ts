import type { AppExplorer } from './explorer.interface.js';
import type { HarnessConfig } from '../schemas/config.schema.js';
import type { RouteInventory } from '../schemas/route-inventory.schema.js';
import { chromium } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

export class PlaywrightExplorer implements AppExplorer {
  async explore(baseUrl: string, config: HarnessConfig): Promise<RouteInventory> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    const discovered = new Set<string>();
    const queue: Array<{ url: string; depth: number }> = [{ url: baseUrl, depth: 0 }];
    const routes: RouteInventory['routes'] = [];
    let pagesSkipped = 0;
    let budgetExceeded = false;

    const normalizeUrl = (candidate: string): string | null => {
      try {
        const next = new URL(candidate, baseUrl);
        const root = new URL(baseUrl);
        if (next.origin !== root.origin) {
          return null;
        }

        next.hash = '';
        return next.toString();
      } catch {
        return null;
      }
    };

    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) {
        break;
      }

      if (discovered.size >= config.maxPagesToScan) {
        budgetExceeded = true;
        pagesSkipped += queue.length + 1;
        break;
      }

      const normalized = normalizeUrl(next.url);
      if (!normalized || discovered.has(normalized)) {
        continue;
      }

      discovered.add(normalized);
      const page = await context.newPage();
      page.setDefaultTimeout(config.timeoutMs);
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      page.on('pageerror', (error) => {
        consoleErrors.push(error.message);
      });

      let statusCode: number | undefined;
      let links: string[] = [];
      let brokenLinks: string[] = [];
      let buttonLabels: string[] = [];
      let formCount = 0;
      let pageTitle = '';
      let a11yViolations: RouteInventory['routes'][number]['a11yViolations'] = [];

      try {
        const response = await page.goto(normalized, { waitUntil: 'domcontentloaded' });
        statusCode = response?.status();
        pageTitle = await page.title();
        formCount = await page.locator('form').count();
        buttonLabels = await page
          .locator('button')
          .evaluateAll((buttons) =>
            buttons
              .map((button) => button.textContent?.trim() ?? '')
              .filter((text) => text.length > 0)
              .slice(0, 50)
          );

        links = await page
          .locator('a[href]')
          .evaluateAll((anchors) =>
            anchors
              .map((anchor) => (anchor as HTMLAnchorElement).href)
              .filter((href) => typeof href === 'string' && href.length > 0)
          );

        const uniqueLinks = [...new Set(links)];
        brokenLinks = uniqueLinks.filter((href) => {
          try {
            const parsed = new URL(href);
            return parsed.protocol !== 'http:' && parsed.protocol !== 'https:';
          } catch {
            return true;
          }
        });
        links = uniqueLinks;

        try {
          const axeResult = await new AxeBuilder({ page }).analyze();
          a11yViolations = axeResult.violations.map((violation) => ({
            id: violation.id,
            impact: (violation.impact ?? 'minor') as 'minor' | 'moderate' | 'serious' | 'critical',
            description: violation.description,
            helpUrl: violation.helpUrl,
            nodes: violation.nodes.length,
          }));
        } catch {
          a11yViolations = [];
        }

        if (next.depth < config.maxDepth) {
          for (const href of links) {
            const internal = normalizeUrl(href);
            if (internal && !discovered.has(internal)) {
              queue.push({ url: internal, depth: next.depth + 1 });
            }
          }
        }
      } catch (error) {
        consoleErrors.push(error instanceof Error ? error.message : String(error));
      } finally {
        routes.push({
          path: normalized,
          pageTitle: pageTitle || normalized,
          links,
          formCount,
          buttonLabels,
          consoleErrors,
          brokenLinks,
          a11yViolations,
          statusCode,
        });
        await page.close();
      }
    }

    await context.close();
    await browser.close();

    return {
      scannedAt: new Date().toISOString(),
      baseUrl,
      routes,
      pagesSkipped,
      budgetExceeded,
    };
  }
}
