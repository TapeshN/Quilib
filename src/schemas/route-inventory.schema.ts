import { z } from 'zod';

export const A11yViolationSchema = z.object({
  id: z.string(),
  impact: z.enum(['minor', 'moderate', 'serious', 'critical']),
  description: z.string(),
  helpUrl: z.string(),
  nodes: z.number().int(),
});

export const RouteSchema = z.object({
  path: z.string(),
  pageTitle: z.string(),
  links: z.array(z.string()),
  formCount: z.number().int(),
  buttonLabels: z.array(z.string()),
  consoleErrors: z.array(z.string()),
  brokenLinks: z.array(z.string()),
  a11yViolations: z.array(A11yViolationSchema),
  statusCode: z.number().int().optional(),
});

export const RouteInventorySchema = z.object({
  scannedAt: z.string().datetime(),
  baseUrl: z.string().url(),
  routes: z.array(RouteSchema),
  pagesSkipped: z.number().int(),
  budgetExceeded: z.boolean(),
});

export type RouteInventory = z.infer<typeof RouteInventorySchema>;
export type Route = z.infer<typeof RouteSchema>;
