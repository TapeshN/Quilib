import type { GapAnalysis } from '../schemas/gap-analysis.schema.js';

export async function writeJsonReport(
  analysis: GapAnalysis,
  outputDir: string
): Promise<void> {
  throw new Error('Not implemented');
}
