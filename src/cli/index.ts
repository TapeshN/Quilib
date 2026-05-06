#!/usr/bin/env node
import { Command } from 'commander';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { HarnessConfigSchema, type HarnessConfig } from '../schemas/config.schema.js';
import { observe } from '../phases/observe.js';
import { think } from '../phases/think.js';
import { act } from '../phases/act.js';

const program = new Command();
const AnalyzeUrlSchema = z.string().url();
type AnalyzeMode = 'url-only' | 'url-repo';

async function loadConfig(): Promise<HarnessConfig> {
  const configPath = resolve(process.cwd(), 'quilib.config.ts');
  const configModule = await import(pathToFileURL(configPath).href);
  return HarnessConfigSchema.parse(configModule.default);
}

async function runAnalyze(options: { url: string; repo?: string }): Promise<void> {
  const validatedUrl = AnalyzeUrlSchema.parse(options.url);
  const mode: AnalyzeMode = options.repo ? 'url-repo' : 'url-only';
  const config = await loadConfig();
  console.log('[quilib] Detected mode:', mode);
  console.log('[quilib] Active config:', config);

  const observed = await observe(validatedUrl, options.repo, config);
  const analysis = await think(observed, config);
  await act(analysis, config);
}

program
  .name('quilib')
  .description('Quilib — QA harness')
  .version('0.1.0');

program
  .command('analyze')
  .description('Analyze an app for quality gaps')
  .requiredOption('--url <url>', 'Base URL of the app to analyze')
  .option('--repo <path>', 'Path to the app repo')
  .option('--prd <path>', 'Path to a PRD markdown file')
  .option(
    '--adapter <type>',
    'Override default test adapter (playwright, cypress-e2e, cypress-component, api)',
    'playwright'
  )
  .action(async (options) => {
    await runAnalyze({ url: options.url, repo: options.repo });
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[quilib] Analyze failed:', message);
  process.exit(1);
});
