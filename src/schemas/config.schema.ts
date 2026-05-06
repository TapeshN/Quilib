import { z } from 'zod';

export type ExplorerType = 'playwright' | 'cypress';
export type AdapterType = 'playwright' | 'cypress-e2e' | 'cypress-component' | 'api' | 'accessibility';

export const HarnessConfigSchema = z.object({
  maxPagesToScan: z.number().int().positive(),
  maxDepth: z.number().int().positive(),
  timeoutMs: z.number().int().positive(),
  retryCount: z.number().int().min(0),
  llmTokenBudget: z.number().int().positive(),
  testGenerationLimit: z.number().int().positive(),
  readOnlyMode: z.boolean(),
  requireHumanReview: z.boolean(),
  failOnConsoleError: z.boolean(),
  explorer: z.enum(['playwright', 'cypress']).default('playwright'),
  defaultAdapter: z.enum(['playwright', 'cypress-e2e', 'cypress-component', 'api', 'accessibility']).default('playwright'),
  adapters: z.array(z.enum(['playwright', 'cypress-e2e', 'cypress-component', 'api', 'accessibility'])).default(['playwright']),
});

export type HarnessConfig = z.infer<typeof HarnessConfigSchema>;
