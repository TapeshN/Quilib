import type { GapAnalysis } from '../schemas/gap-analysis.schema.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function writeMarkdownReport(
  analysis: GapAnalysis,
  outputDir: string
): Promise<void> {
  const bySeverity = {
    high: analysis.gaps.filter((gap) => gap.severity === 'high').length,
    medium: analysis.gaps.filter((gap) => gap.severity === 'medium').length,
    low: analysis.gaps.filter((gap) => gap.severity === 'low').length,
  };

  const lines = [
    '# Quilib Quality Gap Report',
    '',
    `- Analyzed at: ${analysis.analyzedAt}`,
    `- Mode: ${analysis.mode}`,
    `- Release confidence: ${analysis.releaseConfidence}%`,
    `- Total gaps: ${analysis.gaps.length}`,
    `- High: ${bySeverity.high}, Medium: ${bySeverity.medium}, Low: ${bySeverity.low}`,
    '',
    '## Gaps',
    '',
  ];

  if (analysis.gaps.length === 0) {
    lines.push('No quality gaps were detected.');
  } else {
    for (const gap of analysis.gaps) {
      lines.push(`- [${gap.severity.toUpperCase()}] ${gap.path} (${gap.category}) - ${gap.reason}`);
    }
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, 'quality-gap-report.md'), lines.join('\n'), 'utf8');
}
