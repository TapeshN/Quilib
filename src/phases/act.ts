import type { HarnessConfig } from '../schemas/config.schema.js';
import type { GapAnalysis } from '../schemas/gap-analysis.schema.js';

export async function act(
  analysis: GapAnalysis,
  config: HarnessConfig
): Promise<void> {
  throw new Error('Not implemented');
}
