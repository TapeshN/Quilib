import type { Gap, NeutralScenario } from '../schemas/gap-analysis.schema.js';

export async function callLLM(
  prompt: string,
  tokenBudget: number
): Promise<string> {
  throw new Error('Not implemented');
}

export function generateScenariosFromTemplate(gaps: Gap[]): NeutralScenario[] {
  throw new Error('Not implemented');
}
