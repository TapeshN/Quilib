import type { HarnessConfig } from '../schemas/config.schema.js';
import type { GapAnalysis } from '../schemas/gap-analysis.schema.js';
import type { ObserveResult } from './observe.js';

export async function think(
  observed: ObserveResult,
  config: HarnessConfig
): Promise<GapAnalysis> {
  throw new Error('Not implemented');
}
