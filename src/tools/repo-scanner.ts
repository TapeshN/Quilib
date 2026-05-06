import type { RepoAnalysis } from '../schemas/repo-analysis.schema.js';

export async function scanRepo(repoPath: string): Promise<RepoAnalysis> {
  throw new Error('Not implemented');
}
