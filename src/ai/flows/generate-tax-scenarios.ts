'use server';

/**
 * @fileOverview Generates potential tax scenarios tailored for medical professionals and clinics.
 *
 * - generateTaxScenarios - A function that generates tax scenarios.
 * - GenerateTaxScenariosInput - The input type for the generateTaxScenarios function.
 * - GenerateTaxScenariosOutput - The return type for the generateTaxScenarios function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaxScenariosInputSchema = z.object({
  clientData: z.string().describe('The client financial and operational information (revenue, payroll, current tax regime, etc.)'),
  attachedDocuments: z.string().optional().describe('Relevant documents like tax declarations and Simples Nacional extracts as a data URI.'),
  clientType: z.enum(['Novo aberturas de empresa', 'Transferências de contabilidade']).describe('The type of client.'),
});
export type GenerateTaxScenariosInput = z.infer<typeof GenerateTaxScenariosInputSchema>;

const GenerateTaxScenariosOutputSchema = z.object({
  taxScenarios: z.string().describe('The potential tax scenarios tailored for medical professionals and clinics.'),
  irpfImpact: z.string().describe('The estimated impact of different tax regimes on the client\'s IRPF.'),
});
export type GenerateTaxScenariosOutput = z.infer<typeof GenerateTaxScenariosOutputSchema>;

export async function generateTaxScenarios(input: GenerateTaxScenariosInput): Promise<GenerateTaxScenariosOutput> {
  return generateTaxScenariosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaxScenariosPrompt',
  input: {schema: GenerateTaxScenariosInputSchema},
  output: {schema: GenerateTaxScenariosOutputSchema},
  prompt: `You are an expert tax advisor for medical professionals in Brazil. Analyze the client\'s data and generate potential tax scenarios tailored for them, including considerations for 'Novo aberturas de empresa' and 'Transferências de contabilidade'. Consider Fator R, ISS Fixo, Equiparacao Hospitalar and Reflexo no IRPF.

Client Type: {{{clientType}}}
Client Data: {{{clientData}}}

{% if attachedDocuments %}Attached Documents: {{media url=attachedDocuments}}{% endif %}`,
});

const generateTaxScenariosFlow = ai.defineFlow(
  {
    name: 'generateTaxScenariosFlow',
    inputSchema: GenerateTaxScenariosInputSchema,
    outputSchema: GenerateTaxScenariosOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
