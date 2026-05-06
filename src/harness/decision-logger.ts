import type { DecisionLogEntry } from '../schemas/decision-log.schema.js';

export async function logDecision(entry: DecisionLogEntry): Promise<void> {
  throw new Error('Not implemented');
}
