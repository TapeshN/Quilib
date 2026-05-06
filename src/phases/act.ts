import { join } from 'node:path';
import type { HarnessConfig } from '../schemas/config.schema.js';
import type { GapAnalysis } from '../schemas/gap-analysis.schema.js';
import { writeJsonReport } from '../reporters/json-reporter.js';
import { writeMarkdownReport } from '../reporters/markdown-reporter.js';
import { logDecision } from '../harness/decision-logger.js';

export async function act(
  analysis: GapAnalysis,
  config: HarnessConfig
): Promise<void> {
  const outputDir = join(process.cwd(), 'output');

  await writeJsonReport(analysis, outputDir);
  await writeMarkdownReport(analysis, outputDir);

  await logDecision({
    timestamp: new Date().toISOString(),
    phase: 'act',
    decision: 'reports-written',
    reason: `Wrote JSON and Markdown reports to ${outputDir}`,
    metadata: {
      gapCount: analysis.gaps.length,
      scenarioCount: analysis.scenarios.length,
      releaseConfidence: analysis.releaseConfidence,
      requireHumanReview: config.requireHumanReview,
    },
  });

  console.log('\n[quilib] Analysis complete');
  console.log(`  Gaps found:          ${analysis.gaps.length}`);
  console.log(`  Scenarios generated: ${analysis.scenarios.length}`);
  console.log(`  Release confidence:  ${analysis.releaseConfidence}/100`);

  if (config.requireHumanReview) {
    console.log('\n[quilib] Human review required before applying any generated output.');
    console.log('  Reports:   output/report.json and output/report.md');
    console.log('  Decisions: .scan-state/decision-log.json');
  }
}
