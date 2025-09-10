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
  clientData: z.string().optional().describe('The client financial and operational information (revenue, payroll, current tax regime, etc.)'),
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
  prompt: `You are an expert tax advisor for medical professionals in Brazil. Your task is to analyze the client's information and generate potential tax scenarios.

You will be given the client type and one or both of the following: client data as text or an attached document.

Client Type: {{{clientType}}}

{{#if clientData}}
Client Data: {{{clientData}}}
{{/if}}

{{#if attachedDocuments}}
Attached Documents: {{media url=attachedDocuments}}

If the 'Client Data' field is empty, you MUST first transcribe the financial and operational information from the attached document. Then, use this transcribed information to perform the analysis.
{{/if}}

Based on the available information, generate potential tax scenarios tailored for medical professionals/clinics. Your analysis must consider Fator R, ISS Fixo, Equiparacao Hospitalar, and the impact on IRPF (Reflexo no IRPF). Differentiate your advice based on whether the client is a 'Novo aberturas de empresa' or a 'Transferências de contabilidade'.`,
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
