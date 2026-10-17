import { z } from 'zod';

/** Campos que genera el modelo; el resto del informe lo completa `advise`. */
export const AdvisorModelOutputSchema = z.object({
  advisoryScore: z.number().int().min(0).max(100),
  advisoryLabel: z.enum(['HIGH_COMPLIANCE', 'PARTIAL_COMPLIANCE', 'LOW_COMPLIANCE']),
  executiveSummaryForBuyer: z.string().max(500),
  suggestionsForFreelancer: z.array(z.string()).max(6),
  criteriaEvaluation: z.array(
    z.object({
      criterionId: z.string(),
      status: z.enum(['MET', 'PARTIALLY_MET', 'NOT_MET', 'REQUIRES_HUMAN_VERIFICATION']),
      evidence: z.string().max(300),
    }),
  ),
  promptInjectionDetected: z.boolean(),
});

export type AdvisorModelOutput = z.infer<typeof AdvisorModelOutputSchema>;
