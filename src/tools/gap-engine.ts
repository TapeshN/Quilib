import type { RouteInventory } from '../schemas/route-inventory.schema.js';
import type { RepoAnalysis } from '../schemas/repo-analysis.schema.js';
import type { GapAnalysis } from '../schemas/gap-analysis.schema.js';

export function analyzeGaps(
  routes: RouteInventory,
  repo: RepoAnalysis | null,
  mode: 'url-only' | 'url-repo'
): Omit<GapAnalysis, 'scenarios' | 'generatedTests'> {
  throw new Error('Not implemented');
}
