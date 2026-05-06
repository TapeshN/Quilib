import type { HarnessConfig } from '../schemas/config.schema.js';
import type { RouteInventory } from '../schemas/route-inventory.schema.js';
import type { RepoAnalysis } from '../schemas/repo-analysis.schema.js';

export interface ObserveResult {
  routes: RouteInventory;
  repo: RepoAnalysis | null;
}

export async function observe(
  baseUrl: string,
  repoPath: string | undefined,
  config: HarnessConfig
): Promise<ObserveResult> {
  throw new Error('Not implemented');
}
