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

const ScenarioDetailSchema = z.object({
  name: z.string().describe('O nome do cenário (ex: "Simples Nacional Anexo III").'),
  taxRate: z.string().describe('A alíquota efetiva ou porcentagem do imposto (ex: "10,75%").'),
  taxValue: z.string().describe('O valor do imposto a ser pago (ex: "R$ 1.270,15").'),
  description: z.string().describe('Uma breve descrição ou observação sobre o cenário.'),
});

const GenerateTaxScenariosOutputSchema = z.object({
  transcribedText: z.string().describe('As informações financeiras e operacionais transcritas dos documentos anexados.'),
  scenarios: z.array(ScenarioDetailSchema).describe('Uma lista de cenários tributários detalhados.'),
  irpfImpact: z.string().describe("O impacto estimado dos diferentes regimes tributários no IRPF do cliente."),
  recommendation: z.string().describe('A recomendação final sobre o melhor cenário tributário.'),
  monthlyRevenue: z.string().describe('O faturamento mensal identificado para o cliente.'),
});
export type GenerateTaxScenariosOutput = z.infer<typeof GenerateTaxScenariosOutputSchema>;


export async function generateTaxScenarios(input: GenerateTaxScenariosInput): Promise<GenerateTaxScenariosOutput> {
  return generateTaxScenariosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaxScenariosPrompt',
  input: {schema: GenerateTaxScenariosInputSchema},
  output: {schema: GenerateTaxScenariosOutputSchema},
  prompt: `Você é um contador especialista em impostos para profissionais da área médica no Brasil. Sua tarefa é analisar as informações do cliente e gerar um planejamento tributário detalhado. Responda sempre em português do Brasil.

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

Com base em todas as informações disponíveis:
1.  Identifique e extraia o faturamento mensal do cliente e preencha no campo 'monthlyRevenue'. Formate como "R$ XX.XXX,XX".
2.  Gere de 2 a 4 cenários tributários detalhados (Simples Nacional Anexo III, Anexo V, Lucro Presumido, etc.). Para cada cenário, preencha o nome, a alíquota efetiva, o valor do imposto e uma breve descrição (ex: "Considerando Fator R"). Coloque-os no campo 'scenarios'.
3.  Analise o impacto no IRPF (Reflexo no IRPF) e preencha no campo 'irpfImpact'.
4.  Forneça uma recomendação clara, analítica e direta sobre qual o melhor cenário no campo 'recommendation'. Justifique sua decisão com base nos números, no impacto do IRPF e nos objetivos de longo prazo do cliente. Aja como um consultor financeiro, ajudando na tomada de decisão.
5.  Diferencie seu conselho com base se o cliente é uma 'Novo aberturas de empresa' ou uma 'Transferências de contabilidade'. Para transferências, considere os custos e a complexidade da migração. Para novas empresas, foque na estrutura ideal desde o início.

Sua resposta deve ser estruturada estritamente de acordo com o JSON de saída.`,
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
