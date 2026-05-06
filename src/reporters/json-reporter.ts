import type { GapAnalysis } from '../schemas/gap-analysis.schema.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function writeJsonReport(
  analysis: GapAnalysis,
  outputDir: string
): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    join(outputDir, 'quality-gap-report.json'),
    JSON.stringify(analysis, null, 2),
    'utf8'
  );
}
