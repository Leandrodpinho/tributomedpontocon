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
  clientData: z.string().optional().describe('The client financial and operational information (revenue, etc.)'),
  payrollExpenses: z.string().optional().describe('As despesas com a folha de pagamento do cliente.'),
  attachedDocuments: z.array(z.string()).optional().describe('Relevant documents like tax declarations and Simples Nacional extracts as a data URI.'),
  clientType: z.enum(['Novo aberturas de empresa', 'Transferências de contabilidade']).describe('The type of client.'),
});
export type GenerateTaxScenariosInput = z.infer<typeof GenerateTaxScenariosInputSchema>;

const ScenarioDetailSchema = z.object({
  name: z.string().describe('O nome do cenário (ex: "Simples Nacional Anexo III").'),
  taxRate: z.string().describe('A alíquota efetiva ou porcentagem do imposto (ex: "10,75%").'),
  taxValue: z.string().describe('O valor do imposto a ser pago (ex: "R$ 1.270,15").'),
  inssRate: z.string().describe('A alíquota do INSS para este cenário.'),
  irRate: z.string().describe('A alíquota do Imposto de Renda (IR) para este cenário.'),
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
  prompt: `Você é um contador especialista em impostos para profissionais da área médica no Brasil, atualizado com a legislação vigente de 2025. Sua tarefa é analisar as informações do cliente e gerar um planejamento tributário detalhado e analítico. Responda sempre em português do Brasil.

Você receberá o tipo de cliente e informações financeiras.

Tipo de Cliente: {{{clientType}}}
{{#if payrollExpenses}}Folha Salarial Bruta: {{{payrollExpenses}}}{{/if}}

{{#if clientData}}
Dados do Cliente (texto): {{{clientData}}}
{{/if}}

{{#if attachedDocuments}}
Documentos Anexados:
{{#each attachedDocuments}}
- Documento: {{media url=this}}
{{/each}}

Se houver documentos anexados, você DEVE primeiro transcrever as informações financeiras e operacionais de TODOS eles em um único texto consolidado. Este texto transcrito deve ser colocado no campo 'transcribedText'. Use essa informação transcrita (juntamente com qualquer texto fornecido pelo usuário e o campo de folha salarial) para realizar a análise completa. Se apenas texto for fornecido, use-o para a análise e deixe 'transcribedText' vazio.
{{else}}
{{#if clientData}}
{{! Nenhuma instrução especial necessária se apenas clientData for fornecido. }}
{{else}}
Você DEVE pedir ao usuário para fornecer dados em texto ou documentos.
{{/if}}
{{/if}}

Com base em todas as informações disponíveis e na legislação de 2025:
1.  **Extração e Análise de Faturamento:** Identifique e extraia o faturamento mensal do cliente e preencha o campo 'monthlyRevenue'. Formate como "R$ XX.XXX,XX".
2.  **Geração de Cenários Tributários:** Gere de 2 a 4 cenários detalhados (Simples Nacional Anexo III, Anexo V, Lucro Presumido). Para cada cenário:
    *   **Cálculo do CPP:** Você DEVE calcular a Contribuição Previdenciária Patronal (CPP) aplicável a cada regime. Não a receberá como entrada.
    *   **Fator R:** Se aplicável (Simples Nacional), calcule o valor de pró-labore necessário para atingir a razão de 28% (folha de salários / faturamento). Deixe claro no campo 'description' qual valor foi usado.
    *   **Impostos:** Preencha 'taxRate' (alíquota efetiva) e 'taxValue' (valor do imposto).
    *   **Encargos:** Calcule e preencha 'inssRate' (alíquota do INSS sobre o pró-labore/salário) e 'irRate' (alíquota do Imposto de Renda na fonte).
    *   Coloque os resultados no campo 'scenarios'.
3.  **Impacto no IRPF:** Analise o impacto no IRPF do sócio (Reflexo no IRPF), considerando o pró-labore e a distribuição de lucros de cada cenário. Preencha no campo 'irpfImpact'.
4.  **Recomendação Consultiva:** Forneça uma recomendação clara, analítica e direta sobre qual o melhor cenário no campo 'recommendation'. Justifique sua decisão com base nos números (imposto total, IRPF, economia), na complexidade e nos objetivos de longo prazo do cliente. Aja como um consultor financeiro, ajudando na tomada de decisão.
5.  **Diferenciação por Cliente:** Adapte seu conselho com base se o cliente é uma 'Novo aberturas de empresa' (foco na estrutura ideal inicial) ou uma 'Transferências de contabilidade' (considere custos e complexidade da migração).

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
