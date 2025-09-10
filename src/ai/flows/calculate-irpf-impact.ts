// src/ai/flows/calculate-irpf-impact.ts
'use server';

/**
 * @fileOverview Estimates the impact of different tax regimes on the client's IRPF.
 *
 * - calculateIRPFImpact - A function that calculates the IRPF impact based on the input.
 * - CalculateIRPFImpactInput - The input type for the calculateIRPFImpact function.
 * - CalculateIRPFImpactOutput - The return type for the calculateIRPFImpact function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateIRPFImpactInputSchema = z.object({
  taxRegime: z.enum(['Simples Nacional Anexo III', 'Simples Nacional Anexo V', 'Lucro Presumido', 'Lucro Real']).describe('The tax regime being considered.'),
  proLabore: z.number().describe('The amount of pro-labore paid to the owner(s).'),
  profitDistribution: z.number().describe('The amount of profit distribution to the owner(s).'),
  inssContribution: z.number().describe('The amount of INSS contribution.'),
  clientRevenue: z.number().describe('The client revenue.'),
  payrollExpenses: z.number().describe('The client payroll expenses.'),
});
export type CalculateIRPFImpactInput = z.infer<typeof CalculateIRPFImpactInputSchema>;

const CalculateIRPFImpactOutputSchema = z.object({
  irpfImpact: z.string().describe('The estimated impact on the client\u2019s IRPF (Imposto de Renda Pessoa Física).'),
});
export type CalculateIRPFImpactOutput = z.infer<typeof CalculateIRPFImpactOutputSchema>;

export async function calculateIRPFImpact(input: CalculateIRPFImpactInput): Promise<CalculateIRPFImpactOutput> {
  return calculateIRPFImpactFlow(input);
}

const calculateIRPFImpactPrompt = ai.definePrompt({
  name: 'calculateIRPFImpactPrompt',
  input: {schema: CalculateIRPFImpactInputSchema},
  output: {schema: CalculateIRPFImpactOutputSchema},
  prompt: `You are an expert contador, specializing in estimating IRPF (Imposto de Renda Pessoa Física) impacts for medical professionals.

  Based on the provided tax regime, pro-labore, profit distribution, INSS contribution, client revenue, and payroll expenses, estimate the impact on the client's IRPF.

  Tax Regime: {{{taxRegime}}}
  Pro-Labore: {{{proLabore}}}
  Profit Distribution: {{{profitDistribution}}}
  INSS Contribution: {{{inssContribution}}}
  Client Revenue: {{{clientRevenue}}}
  Payroll Expenses: {{{payrollExpenses}}}

  Consider the following:
  - Pro-labore is taxed as salary.
  - Profit distributions are generally tax-exempt.
  - INSS contributions impact retirement benefits and can be deducted.
  - High pro-labore (especially in Simples Nacional Anexo III to meet Fator R) can increase IRPF.
  - Different regimes (Anexo V, Lucro Presumido) may allow for minimizing pro-labore.

  Provide a detailed and precise estimation of the IRPF impact, including potential refunds or liabilities.
  `,
});

const calculateIRPFImpactFlow = ai.defineFlow(
  {
    name: 'calculateIRPFImpactFlow',
    inputSchema: CalculateIRPFImpactInputSchema,
    outputSchema: CalculateIRPFImpactOutputSchema,
  },
  async input => {
    const {output} = await calculateIRPFImpactPrompt(input);
    return output!;
  }
);
