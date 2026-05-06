import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { DecisionLogEntrySchema } from '../schemas/decision-log.schema.js';
import type { DecisionLogEntry } from '../schemas/decision-log.schema.js';

const LOG_FILE = join(process.cwd(), '.scan-state', 'decision-log.json');
const STATE_DIR = join(process.cwd(), '.scan-state');

export async function logDecision(entry: DecisionLogEntry): Promise<void> {
  try {
    const validation = DecisionLogEntrySchema.safeParse(entry);
    if (!validation.success) {
      console.warn(
        `Failed to log decision: entry validation failed with issues ${JSON.stringify(validation.error.issues)}`
      );
      return;
    }

    await mkdir(STATE_DIR, { recursive: true });

    let log: DecisionLogEntry[] = [];
    if (existsSync(LOG_FILE)) {
      try {
        const raw = await readFile(LOG_FILE, 'utf8');
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
          console.warn('Failed to log decision: decision-log.json is not an array; resetting log');
        } else {
          const validatedEntries: DecisionLogEntry[] = [];
          for (const item of parsed) {
            const itemValidation = DecisionLogEntrySchema.safeParse(item);
            if (itemValidation.success) {
              validatedEntries.push(itemValidation.data);
            } else {
              console.warn(
                `Invalid existing decision log entry skipped: ${JSON.stringify(itemValidation.error.issues)}`
              );
            }
          }
          log = validatedEntries;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to read existing decision log at ${LOG_FILE}: ${message}`);
      }
    }

    log.push(validation.data);
    await writeFile(LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to log decision entry to ${LOG_FILE}: ${message}`);
  }
}

/*
Manual smoke test:

await logDecision({
  timestamp: new Date().toISOString(),
  phase: 'observe',
  decision: 'Started crawl',
  reason: 'Initial discovery pass',
  metadata: { url: 'https://example.com' },
});
*/
