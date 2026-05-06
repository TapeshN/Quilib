import { chromium } from '@playwright/test';
import { RouteInventorySchema, type RouteInventory, type Route } from '../schemas/route-inventory.schema.js';
import type { HarnessConfig } from '../schemas/config.schema.js';

export class PlaywrightExplorer {
  async explore(baseUrl: string, config: HarnessConfig): Promise<RouteInventory> {
    const browser = await chromium.launch({ headless: true });
    const visited = new Set<string>();
    const queue: string[] = [baseUrl];
    const routes: Route[] = [];
    let budgetExceeded = false;

    try {
      while (queue.length > 0) {
        if (visited.size >= config.maxPagesToScan) {
          budgetExceeded = queue.length > 0;
          break;
        }

        const url = queue.shift();
        if (!url) {
          continue;
        }

        const normalized = url.split('?')[0].split('#')[0];
        if (visited.has(normalized)) continue;
        visited.add(normalized);

        const page = await browser.newPage();
        const consoleErrors: string[] = [];

        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        try {
          await page.goto(url, {
            timeout: config.timeoutMs,
            waitUntil: 'domcontentloaded',
          });

          const pageTitle = await page.title();
          const formCount = await page.locator('form').count();
          const buttonLabels = await page.locator('button').allInnerTexts();

          const hrefs = await page.evaluate(() =>
            Array.from(document.querySelectorAll('a[href]'))
              .map((a) => (a as HTMLAnchorElement).href)
              .filter(Boolean)
          );

          const base = new URL(baseUrl);
          const internalLinks = hrefs
            .filter((href) => {
              try {
                const u = new URL(href);
                return u.origin === base.origin;
              } catch {
                return false;
              }
            })
            .map((href) => href.split('?')[0].split('#')[0]);

          for (const link of internalLinks) {
            if (!visited.has(link) && !queue.includes(link)) {
              queue.push(link);
            }
          }

          const path = new URL(url).pathname || '/';

          routes.push({
            path,
            pageTitle,
            links: internalLinks,
            formCount,
            buttonLabels: buttonLabels.map((b) => b.trim()).filter(Boolean),
            consoleErrors,
            brokenLinks: [],
            a11yViolations: [],
          });
        } catch (err) {
          const path = (() => {
            try {
              return new URL(url).pathname || '/';
            } catch {
              return url;
            }
          })();
          routes.push({
            path,
            pageTitle: '',
            links: [],
            formCount: 0,
            buttonLabels: [],
            consoleErrors: [`Navigation error: ${String(err)}`],
            brokenLinks: [],
            a11yViolations: [],
          });
        } finally {
          await page.close();
        }
      }
    } finally {
      await browser.close();
    }

    return RouteInventorySchema.parse({
      scannedAt: new Date().toISOString(),
      baseUrl,
      routes,
      pagesSkipped: budgetExceeded ? queue.length : 0,
      budgetExceeded,
    });
  }
}
