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

const calculateIRPFImpactPrompt = ai.definePrompt({
  name: 'calculateIRPFImpactPrompt',
  input: {schema: CalculateIRPFImpactInputSchema},
  output: {schema: CalculateIRPFImpactOutputSchema},
  prompt: `Você é um contador especialista, especializado em estimar os impactos do IRPF (Imposto de Renda Pessoa Física) para profissionais da área médica.

  Com base no regime tributário, pró-labore, distribuição de lucros, contribuição para o INSS, receita do cliente e despesas com folha de pagamento fornecidos, estime o impacto no IRPF do cliente.

  Regime Tributário: {{{taxRegime}}}
  Pró-Labore: {{{proLabore}}}
  Distribuição de Lucros: {{{profitDistribution}}}
  Contribuição para o INSS: {{{inssContribution}}}
  Receita do Cliente: {{{clientRevenue}}}
  Despesas com Folha de Pagamento: {{{payrollExpenses}}}

  Considere o seguinte:
  - O pró-labore é tributado como salário.
  - As distribuições de lucro são geralmente isentas de impostos.
  - As contribuições para o INSS impactam os benefícios da aposentadoria e podem ser deduzidas.
  - Um pró-labore alto (especialmente no Simples Nacional Anexo III para atender ao Fator R) pode aumentar o IRPF.
  - Diferentes regimes (Anexo V, Lucro Presumido) podem permitir a minimização do pró-labore.`,
});

export const calculateIRPFImpactFlow = ai.defineFlow(
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

export async function calculateIRPFImpact(input: CalculateIRPFImpactInput): Promise<CalculateIRPFImpactOutput> {
  return calculateIRPFImpactFlow(input);
}
