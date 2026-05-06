#!/usr/bin/env node
import { Command } from 'commander';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { HarnessConfigSchema, type HarnessConfig } from '../schemas/config.schema.js';
import { createExplorer } from '../tools/explorer-factory.js';
import { RouteInventorySchema } from '../schemas/route-inventory.schema.js';
import { scanRepo } from '../tools/repo-scanner.js';
import { RepoAnalysisSchema, TestFileSchema } from '../schemas/repo-analysis.schema.js';
import { analyzeGaps } from '../tools/gap-engine.js';
import { GapAnalysisSchema } from '../schemas/gap-analysis.schema.js';
import { StateManager } from '../harness/state-manager.js';
import { writeJsonReport } from '../reporters/json-reporter.js';
import { writeMarkdownReport } from '../reporters/markdown-reporter.js';

const program = new Command();

async function loadConfig(): Promise<HarnessConfig> {
  const configPath = resolve(process.cwd(), 'quilib.config.ts');
  const configModule = await import(pathToFileURL(configPath).href);
  return HarnessConfigSchema.parse(configModule.default);
}

async function runScan(options: { app?: string; url?: string; repo?: string }): Promise<void> {
  const appUrl = options.app ?? options.url;
  if (!appUrl) {
    throw new Error('App URL is required. Use --app or --url.');
  }

  const config = await loadConfig();
  const explorer = createExplorer(config.explorer);
  const stateManager = new StateManager();

  const routes = RouteInventorySchema.parse(await explorer.explore(appUrl, config));
  await stateManager.writeState('discovered-routes.json', routes, RouteInventorySchema);

  let repoAnalysis: z.infer<typeof RepoAnalysisSchema> | null = null;
  if (options.repo) {
    const repoPath = resolve(process.cwd(), options.repo);
    repoAnalysis = RepoAnalysisSchema.parse(await scanRepo(repoPath));
    await stateManager.writeState('repo-inventory.json', repoAnalysis, RepoAnalysisSchema);
    await stateManager.writeState(
      'test-inventory.json',
      repoAnalysis.testFiles,
      z.array(TestFileSchema)
    );
  }

  const analysis = GapAnalysisSchema.parse({
    ...analyzeGaps(routes, repoAnalysis, repoAnalysis ? 'url-repo' : 'url-only'),
    scenarios: [],
    generatedTests: [],
  });

  const outputDir = join(process.cwd(), 'output');
  await writeJsonReport(analysis, outputDir);
  await writeMarkdownReport(analysis, outputDir);
}

program
  .name('quilib')
  .description('Quilib — QA harness')
  .version('0.1.0');

program
  .command('analyze')
  .description('Analyze an app for quality gaps')
  .requiredOption('--url <url>', 'Base URL of the app to analyze')
  .option('--repo <path>',        'Path to the app repo')
  .option('--prd <path>',         'Path to a PRD markdown file')
  .option('--adapter <type>',     'Override default test adapter (playwright, cypress-e2e, cypress-component, api)', 'playwright')
  .action(async (options) => {
    await runScan({ url: options.url, repo: options.repo });
  });

program
  .command('scan')
  .description('Scan app and generate state/reports')
  .requiredOption('--app <url>', 'App URL to scan')
  .option('--repo <path>', 'Path to app repo')
  .action(async (options) => {
    await runScan({ app: options.app, repo: options.repo });
  });

program.parse();
