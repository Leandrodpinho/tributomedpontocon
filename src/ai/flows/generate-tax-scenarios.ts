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
  attachedDocuments: z.array(z.string()).optional().describe('Relevant documents like tax declarations and Simples Nacional extracts as a data URI.'),
  clientType: z.enum(['Novo aberturas de empresa', 'Transferências de contabilidade']).describe('The type of client.'),
});
export type GenerateTaxScenariosInput = z.infer<typeof GenerateTaxScenariosInputSchema>;

const GenerateTaxScenariosOutputSchema = z.object({
  transcribedText: z.string().describe('The transcribed financial and operational information from the attached documents.'),
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
  prompt: `Você é um contador especialista em impostos para profissionais da área médica no Brasil. Sua tarefa é analisar as informações do cliente e gerar cenários tributários potenciais. Responda sempre em português do Brasil.

Você receberá o tipo de cliente e um ou ambos dos seguintes: dados do cliente como texto ou documentos anexados.

Tipo de Cliente: {{{clientType}}}

{{#if clientData}}
Dados do Cliente: {{{clientData}}}
{{/if}}

{{#if attachedDocuments}}
Documentos Anexados:
{{#each attachedDocuments}}
- Documento: {{media url=this}}
{{/each}}

Se houver documentos anexados, você DEVE primeiro transcrever as informações financeiras e operacionais de TODOS eles em um único texto consolidado. Este texto transcrito deve ser colocado no campo de saída 'transcribedText'. Em seguida, use essa informação transcrita (juntamente com qualquer texto fornecido pelo usuário no campo 'Dados do Cliente', que deve ser tratado como complementar) para realizar a análise completa. Se apenas texto for fornecido em 'Dados do Cliente' e não houver documentos, use isso para a análise e deixe 'transcribedText' vazio.
{{else}}
{{#if clientData}}
{{! Este bloco está vazio porque se apenas clientData for fornecido, nenhuma instrução especial é necessária. A instrução principal cobrirá isso. }}
{{else}}
Você DEVE pedir ao usuário para fornecer dados em texto ou documentos.
{{/if}}
{{/if}}

Com base em todas as informações disponíveis, gere cenários tributários potenciais adaptados para profissionais/clínicas médicas. Sua análise deve considerar Fator R, ISS Fixo, Equiparação Hospitalar e o impacto no IRPF (Reflexo no IRPF). Diferencie seu conselho com base se o cliente é uma 'Novo aberturas de empresa' ou uma 'Transferências de contabilidade'. Forneça a resposta completa em português do Brasil.`,
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
