import type { RouteInventory } from '../schemas/route-inventory.schema.js';
import type { RepoAnalysis } from '../schemas/repo-analysis.schema.js';
import type { GapAnalysis } from '../schemas/gap-analysis.schema.js';

export function analyzeGaps(
  routes: RouteInventory,
  repo: RepoAnalysis | null,
  mode: 'url-only' | 'url-repo'
): Omit<GapAnalysis, 'scenarios' | 'generatedTests'> {
  const gaps: GapAnalysis['gaps'] = [];
  let counter = 0;

  for (const route of routes.routes) {
    if (route.consoleErrors.length > 0) {
      gaps.push({
        id: `gap-${++counter}`,
        path: route.path,
        severity: 'high',
        reason: `Console errors detected (${route.consoleErrors.length})`,
        category: 'console-error',
      });
    }

    if (route.brokenLinks.length > 0) {
      gaps.push({
        id: `gap-${++counter}`,
        path: route.path,
        severity: 'medium',
        reason: `Broken or invalid links detected (${route.brokenLinks.length})`,
        category: 'broken-link',
      });
    }

    if (route.a11yViolations.length > 0) {
      const critical = route.a11yViolations.some((v) => v.impact === 'critical' || v.impact === 'serious');
      gaps.push({
        id: `gap-${++counter}`,
        path: route.path,
        severity: critical ? 'high' : 'medium',
        reason: `Accessibility violations detected (${route.a11yViolations.length})`,
        category: 'a11y',
      });
    }
  }

  if (mode === 'url-repo' && repo) {
    for (const route of routes.routes) {
      const covered = repo.testFiles.some((testFile) => testFile.coveredPaths.includes(route.path));
      if (!covered) {
        gaps.push({
          id: `gap-${++counter}`,
          path: route.path,
          severity: 'medium',
          reason: 'No existing test appears to cover this discovered route',
          category: 'untested-route',
        });
      }
    }
  }

  const releaseConfidence = Math.max(0, Math.min(100, 100 - gaps.length * 8));
  return {
    analyzedAt: new Date().toISOString(),
    mode,
    releaseConfidence,
    gaps,
  };
}
