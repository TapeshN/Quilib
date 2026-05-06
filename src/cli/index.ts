import { Command } from 'commander';

const program = new Command();

program
  .name('quilib')
  .description('Quilib — QA harness')
  .version('0.1.0');

program
  .command('analyze')
  .description('Analyze an app for quality gaps')
  .requiredOption('--url <url>',  'Base URL of the app to analyze')
  .option('--repo <path>',        'Path to the app repo')
  .option('--prd <path>',         'Path to a PRD markdown file')
  .option('--adapter <type>',     'Override default test adapter (playwright, cypress-e2e, cypress-component, api)', 'playwright')
  .action(async (_options) => {
    throw new Error('Not implemented');
  });

program.parse();
