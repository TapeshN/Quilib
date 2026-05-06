import { randomUUID } from 'node:crypto';
import { GapSchema, type GapAnalysis, type Gap } from '../schemas/gap-analysis.schema.js';
import type { RouteInventory } from '../schemas/route-inventory.schema.js';
import type { RepoAnalysis } from '../schemas/repo-analysis.schema.js';

export function analyzeGaps(
  routes: RouteInventory,
  repo: RepoAnalysis | null,
  mode: 'url-only' | 'url-repo'
): Omit<GapAnalysis, 'scenarios' | 'generatedTests'> {
  const coveredPaths = new Set<string>();
  if (repo) {
    for (const testFile of repo.testFiles) {
      for (const path of testFile.coveredPaths) {
        coveredPaths.add(path);
      }
    }
  }

  const gaps: Gap[] = [];
  const addGap = (gap: Gap): void => {
    const validated = GapSchema.parse(gap);
    gaps.push(validated);
  };

  for (const route of routes.routes) {
    if (repo && !coveredPaths.has(route.path)) {
      const highRisk = /checkout|payment|auth|login|order/i.test(route.path);
      addGap({
        id: randomUUID(),
        path: route.path,
        severity: highRisk ? 'high' : 'medium',
        reason: `Route is not covered by existing tests: ${route.path}`,
        category: 'untested-route',
      });
    }

    if (route.consoleErrors.length > 0) {
      addGap({
        id: randomUUID(),
        path: route.path,
        severity: 'high',
        reason: `Console errors detected (${route.consoleErrors.length})`,
        category: 'console-error',
      });
    }

    if (route.brokenLinks.length > 0) {
      addGap({
        id: randomUUID(),
        path: route.path,
        severity: 'medium',
        reason: `Broken or invalid links detected (${route.brokenLinks.length})`,
        category: 'broken-link',
      });
    }

    for (const violation of route.a11yViolations) {
      const severity: Gap['severity'] =
        violation.impact === 'critical' || violation.impact === 'serious'
          ? 'high'
          : violation.impact === 'moderate'
            ? 'medium'
            : 'low';
      addGap({
        id: randomUUID(),
        path: route.path,
        severity,
        reason: `A11y violation ${violation.id} (${violation.impact}): ${violation.description}`,
        category: 'a11y',
      });
    }
  }

  const highCount = gaps.filter((g) => g.severity === 'high').length;
  const mediumCount = gaps.filter((g) => g.severity === 'medium').length;
  const lowCount = gaps.filter((g) => g.severity === 'low').length;
  const releaseConfidence = Math.max(0, 100 - highCount * 20 - mediumCount * 8 - lowCount * 3);

  return {
    analyzedAt: new Date().toISOString(),
    mode,
    releaseConfidence,
    gaps,
  };
}
