// src/ai/flows/calculate-irpf-impact.ts
'use server';

/**
 * @fileOverview Estimates the impact of different tax regimes on the client's IRPF.
 *
 * - calculateIRPFImpact - A function that calculates the IRPF impact based on the input.
 * - CalculateIRPFImpactInput - The input type for the calculateIRPFImpact function.
 * - CalculateIRPFImpactOutput - The return type for the calculateIRPFImpact function.
 */

// src/ai/flows/calculate-irpf-impact.ts
'use server';

/**
 * @fileOverview Estimates the impact of different tax regimes on the client's IRPF.
 *
 * - calculateIRPFImpact - A function that calculates the IRPF impact based on the input.
 * - CalculateIRPFImpactInput - The input type for the calculateIRPFImpact function.
 * - CalculateIRPFImpactOutput - The return type for the calculateIRPFImpact function.
 */

import { z } from 'zod';
import { IRPF_TABLE_2026, calculateIRPF, calculateINSS } from '@/lib/tax-calculator';

const CalculateIRPFImpactInputSchema = z.object({
  taxRegime: z.enum(['Simples Nacional Anexo III', 'Simples Nacional Anexo V', 'Lucro Presumido', 'Lucro Real']).describe('The tax regime being considered.'),
  proLabore: z.number().describe('The amount of pro-labore paid to the owner(s).'),
  profitDistribution: z.number().describe('The amount of profit distribution to the owner(s).'),
  inssContribution: z.number().describe('The amount of INSS contribution.'),
  clientRevenue: z.number().describe('The client revenue.'),
  payrollExpenses: z.number().describe('The client payroll expenses.'),
});
export type CalculateIRPFImpactInput = z.infer<typeof CalculateIRPFImpactInputSchema>;

const IRPFImpactDetailSchema = z.object({
  taxableIncome: z.number().describe('Base de cálculo do IRPF (renda tributável).'),
  taxBracket: z.string().describe('Faixa da alíquota do IRPF aplicada (ex: "27,5%").'),
  irpfDue: z.number().describe('Valor do IRPF devido.'),
  deductions: z.number().describe('Total de deduções consideradas (ex: INSS).'),
  netImpact: z.number().describe('Valor final a pagar ou a restituir.'),
  summary: z.string().describe('Um resumo explicativo do impacto no IRPF do cliente.'),
});

const CalculateIRPFImpactOutputSchema = z.object({
  impactDetails: IRPFImpactDetailSchema,
});
export type CalculateIRPFImpactOutput = z.infer<typeof CalculateIRPFImpactOutputSchema>;

export async function calculateIRPFImpact(input: CalculateIRPFImpactInput): Promise<CalculateIRPFImpactOutput> {
  // Deterministic calculation replacing AI
  const { proLabore, inssContribution, taxRegime } = input;

  const taxableIncome = proLabore - inssContribution;
  const inssDeduction = inssContribution; // Using the input INSS as the deduction

  // Calculate exact IRPF
  const irpfDue = calculateIRPF(proLabore, inssDeduction);

  // Determine Bracket string
  const base = taxableIncome;
  const bracket = IRPF_TABLE_2026.find(b => base <= b.limit) || IRPF_TABLE_2026[IRPF_TABLE_2026.length - 1];
  const taxBracket = (bracket.rate * 100).toFixed(1).replace('.', ',') + '%';

  const netImpact = irpfDue; // Simply the tax due for now

  const summary = `Considerando o regime ${taxRegime}, com um pró-labore de R$ ${proLabore.toFixed(2)} e dedução de INSS de R$ ${inssDeduction.toFixed(2)}, a base de cálculo é de R$ ${base.toFixed(2)}. Isso enquadra o cliente na faixa de ${taxBracket}, resultando em um IRPF estimado de R$ ${irpfDue.toFixed(2)}.`;

  return {
    impactDetails: {
      taxableIncome,
      taxBracket,
      irpfDue,
      deductions: inssDeduction,
      netImpact,
      summary
    }
  };
}
