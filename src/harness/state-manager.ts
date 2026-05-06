import type { ZodSchema } from 'zod';

export class StateManager {
  async readState<T>(filename: string, schema: ZodSchema<T>): Promise<T> {
    throw new Error('Not implemented');
  }

  async writeState<T>(filename: string, data: T, schema: ZodSchema<T>): Promise<void> {
    throw new Error('Not implemented');
  }
}
