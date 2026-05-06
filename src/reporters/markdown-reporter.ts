import type { GapAnalysis } from '../schemas/gap-analysis.schema.js';

export async function writeMarkdownReport(
  analysis: GapAnalysis,
  outputDir: string
): Promise<void> {
  throw new Error('Not implemented');
}
