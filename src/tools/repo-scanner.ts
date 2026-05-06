import type { RepoAnalysis } from '../schemas/repo-analysis.schema.js';
import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import fg from 'fast-glob';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

function toPosixPath(path: string): string {
  return path.split('\\').join('/');
}

function deriveNextRoute(repoPath: string, file: string): string {
  const normalized = toPosixPath(relative(repoPath, file));
  const withoutPrefix = normalized
    .replace(/^src\/app\//, '/')
    .replace(/^app\//, '/')
    .replace(/^src\/pages\//, '/')
    .replace(/^pages\//, '/');

  return withoutPrefix
    .replace(/\/route\.(t|j)sx?$/, '')
    .replace(/\/page\.(t|j)sx?$/, '')
    .replace(/\/index\.(t|j)sx?$/, '')
    .replace(/\.(t|j)sx?$/, '')
    .replace(/\[(.+?)\]/g, ':$1')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function detectTestType(file: string): RepoAnalysis['testFiles'][number]['type'] {
  const normalized = toPosixPath(file);
  if (normalized.includes('playwright') || /\.spec\.ts$/.test(normalized) || /\.spec\.tsx$/.test(normalized)) {
    return 'playwright';
  }
  if (normalized.includes('cypress/e2e') || normalized.includes('cypress/integration')) {
    return 'cypress-e2e';
  }
  if (normalized.includes('cypress/component')) {
    return 'cypress-component';
  }
  if (/\.(test|spec)\.(t|j)sx?$/.test(normalized)) {
    return 'jest';
  }
  return 'other';
}

function collectCoveredPaths(content: string): string[] {
  const matches = [...content.matchAll(/\/[a-zA-Z0-9\-_/:[\]]*/g)].map((m) => m[0]);
  return [...new Set(matches)].filter((entry) => entry.length > 1).slice(0, 25);
}

export async function scanRepo(repoPath: string): Promise<RepoAnalysis> {
  const routeFiles = await fg(
    [
      'app/**/page.{js,jsx,ts,tsx}',
      'app/**/route.{js,jsx,ts,tsx}',
      'pages/**/*.{js,jsx,ts,tsx}',
      'src/app/**/page.{js,jsx,ts,tsx}',
      'src/app/**/route.{js,jsx,ts,tsx}',
      'src/pages/**/*.{js,jsx,ts,tsx}',
    ],
    {
      cwd: repoPath,
      absolute: true,
      onlyFiles: true,
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
    }
  );

  const routes: RepoAnalysis['routes'] = [];
  for (const file of routeFiles) {
    const content = await readFile(file, 'utf8');
    const routePath = deriveNextRoute(repoPath, file);
    const methods = HTTP_METHODS.filter((method) => new RegExp(`export\\s+async\\s+function\\s+${method}`).test(content));
    if (methods.length === 0) {
      routes.push({ path: routePath, file: relative(repoPath, file), method: 'unknown' });
      continue;
    }
    for (const method of methods) {
      routes.push({ path: routePath, file: relative(repoPath, file), method });
    }
  }

  const testFilesFound = await fg(
    [
      '**/*.{spec,test}.{js,jsx,ts,tsx}',
      'cypress/**/*.{js,jsx,ts,tsx}',
      'playwright/**/*.{js,jsx,ts,tsx}',
      'tests/**/*.{js,jsx,ts,tsx}',
    ],
    {
      cwd: repoPath,
      absolute: true,
      onlyFiles: true,
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
    }
  );

  const testFiles: RepoAnalysis['testFiles'] = [];
  for (const file of testFilesFound) {
    const content = await readFile(file, 'utf8');
    testFiles.push({
      file: relative(repoPath, file),
      type: detectTestType(file),
      coveredPaths: collectCoveredPaths(content),
    });
  }

  const covered = new Set(testFiles.flatMap((testFile) => testFile.coveredPaths));
  const missingTestIds = routes
    .filter((route) => !covered.has(route.path))
    .map((route) => route.path);

  const hasCypress = await fg(['cypress/**'], { cwd: repoPath, onlyDirectories: true, deep: 1 });
  const existingE2eFiles = await fg(['cypress/e2e/**/*.{js,jsx,ts,tsx}', 'cypress/integration/**/*.{js,jsx,ts,tsx}'], {
    cwd: repoPath,
    onlyFiles: true,
    absolute: false,
  });
  const existingComponentFiles = await fg(['cypress/component/**/*.{js,jsx,ts,tsx}'], {
    cwd: repoPath,
    onlyFiles: true,
    absolute: false,
  });

  return {
    scannedAt: new Date().toISOString(),
    repoPath: join(repoPath),
    routes,
    testFiles,
    missingTestIds: [...new Set(missingTestIds)],
    cypressStructure: {
      detected: hasCypress.length > 0,
      e2eFolder: hasCypress.length > 0 ? 'cypress/e2e' : undefined,
      componentFolder: hasCypress.length > 0 ? 'cypress/component' : undefined,
      fixturesFolder: hasCypress.length > 0 ? 'cypress/fixtures' : undefined,
      supportFolder: hasCypress.length > 0 ? 'cypress/support' : undefined,
      hasCommandsFile: (await fg(['cypress/support/commands.{js,ts}'], { cwd: repoPath, onlyFiles: true })).length > 0,
      existingE2eFiles,
      existingComponentFiles,
    },
  };
}
