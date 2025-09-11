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
  payrollExpenses: z.string().optional().describe('As despesas com a folha de pagamento do cliente (CLT).'),
  attachedDocuments: z.array(z.string()).optional().describe('Relevant documents like tax declarations and Simples Nacional extracts as a data URI.'),
  clientType: z.enum(['Novo aberturas de empresa', 'Transferências de contabilidade']).describe('The type of client.'),
});
export type GenerateTaxScenariosInput = z.infer<typeof GenerateTaxScenariosInputSchema>;

const TaxDetailSchema = z.object({
  name: z.string().describe('Nome do tributo (ex: IRPJ, CSLL, PIS, COFINS, ISS, CPP).'),
  rate: z.string().describe('Alíquota do tributo (ex: "4,80%").'),
  value: z.string().describe('Valor do tributo (ex: "R$ 480,00").'),
});

const ProLaboreAnalysisSchema = z.object({
  baseValue: z.string().describe('Valor base do pró-labore utilizado no cálculo.'),
  inssValue: z.string().describe('Valor da contribuição do INSS sobre o pró-labore.'),
  irrfValue: z.string().describe('Valor do IRRF retido na fonte sobre o pró-labore.'),
  netValue: z.string().describe('Valor líquido do pró-labore após deduções.'),
});

const ScenarioDetailSchema = z.object({
  name: z.string().describe('O nome do cenário (ex: "Simples Nacional Anexo III").'),
  totalTaxValue: z.string().describe('O valor total do imposto a ser pago no regime (ex: "R$ 1.270,15").'),
  effectiveRate: z.string().describe('A alíquota efetiva total do regime (ex: "10,75%").'),
  taxBreakdown: z.array(TaxDetailSchema).describe('Detalhamento da composição dos tributos dentro do regime.'),
  proLaboreAnalysis: ProLaboreAnalysisSchema.describe('Análise detalhada do impacto do pró-labore.'),
  netProfitDistribution: z.string().describe('Lucro líquido disponível para distribuição ao sócio após todos os impostos e encargos.'),
  notes: z.string().describe('Observações importantes sobre o cenário, como o uso do Fator R ou o cálculo do INSS patronal.'),
});

const GenerateTaxScenariosOutputSchema = z.object({
  transcribedText: z.string().optional().describe('As informações financeiras e operacionais transcritas dos documentos anexados.'),
  monthlyRevenue: z.string().describe('O faturamento mensal identificado para o cliente.'),
  scenarios: z.array(ScenarioDetailSchema).describe('Uma lista de cenários tributários detalhados.'),
  executiveSummary: z.string().describe('Resumo executivo com a recomendação final sobre o melhor cenário, justificando a decisão com base na economia, complexidade e objetivos do cliente.'),
});
export type GenerateTaxScenariosOutput = z.infer<typeof GenerateTaxScenariosOutputSchema>;


export async function generateTaxScenarios(input: GenerateTaxScenariosInput): Promise<GenerateTaxScenariosOutput> {
  return generateTaxScenariosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaxScenariosPrompt',
  input: {schema: GenerateTaxScenariosInputSchema},
  output: {schema: GenerateTaxScenariosOutputSchema},
  prompt: `Você é um contador-chefe e consultor de negócios para profissionais da área médica no Brasil, atualizado com a legislação vigente de 2025. Sua tarefa é criar um planejamento tributário estratégico e profundo, que sirva como ferramenta para tomada de decisão. Responda sempre em português do Brasil.

Você receberá dados de um cliente:
Tipo de Cliente: {{{clientType}}}
{{#if payrollExpenses}}Folha Salarial Bruta (CLT): {{{payrollExpenses}}}{{/if}}
{{#if clientData}}Dados do Cliente (texto): {{{clientData}}}{{/if}}
{{#if attachedDocuments}}
Documentos Anexados:
{{#each attachedDocuments}}
- Documento: {{media url=this}}
{{/each}}
Primeiro, transcreva as informações financeiras de TODOS os documentos no campo 'transcribedText'. Use este texto consolidado como a fonte primária de dados.
{{/if}}

Com base em todas as informações e na legislação de 2025, execute a seguinte análise V2.0:

1.  **Análise de Faturamento:** Extraia o faturamento mensal e preencha o campo 'monthlyRevenue' (formato "R$ XX.XXX,XX").

2.  **Geração de Cenários Detalhados (Simples Nacional Anexo III/V, Lucro Presumido):** Para cada cenário no array 'scenarios':
    *   **Cálculo dos Tributos:** Calcule o valor de cada tributo (IRPJ, CSLL, PIS, COFINS, ISS) e, quando aplicável (Simples Anexo III com Fator R, Lucro Presumido), a CPP. No Lucro Presumido, a CPP (INSS Patronal) é de 20% sobre a folha de pagamento (CLT + pró-labore). Preencha o array 'taxBreakdown' para cada um, com nome, alíquota e valor.
    *   **Análise do Pró-Labore (Item 3 do Checklist):**
        *   **Estratégia do Fator R (Simples Nacional):** A folha de pagamento para o Fator R é a soma da folha salarial CLT (se informada) e do pró-labore. Determine o pró-labore *mínimo* necessário para que o total da folha alcance 28% do faturamento, permitindo a tributação pelo Anexo III.
        *   **Definição do Pró-Labore:** No cenário do Anexo III, use este pró-labore calculado. Nos outros cenários (Anexo V, Lucro Presumido), use o pró-labore mínimo legal, a menos que uma estratégia diferente seja mais benéfica. Na 'notes', explique a estratégia usada (ex: "Pró-labore ajustado para R$X para alcançar o Fator R e tributar pelo Anexo III.").
        *   **Cálculo de Encargos do Sócio:** Para o valor de pró-labore definido em cada cenário, calcule o INSS (contribuição do sócio, 11%) e o IRRF (conforme tabela progressiva, após deduzir o INSS). Preencha 'proLaboreAnalysis' com os valores base, INSS, IRRF e o valor líquido.
    *   **Totalização:** Calcule e preencha 'totalTaxValue' (soma de todos os impostos da empresa) e 'effectiveRate'.
    *   **Lucro Líquido Final (Distribuição de Lucros):** Calcule o 'netProfitDistribution'. Este é o valor que realmente sobra para o sócio e é calculado como: Faturamento - (Soma de todos os impostos da empresa) - (Valor Bruto do Pró-Labore) - (CPP/INSS Patronal, se aplicável).

3.  **Resumo Executivo e Recomendação:** No campo 'executiveSummary', escreva um resumo claro e direto. Indique qual regime é mais vantajoso (em R$ e %), e por quê. Aja como um consultor, avaliando o equilíbrio entre a economia de impostos, a complexidade de cada regime e o impacto no pró-labore vs. distribuição de lucros. Adapte o conselho se for 'Novo aberturas de empresa' ou 'Transferências de contabilidade'.

Sua resposta deve seguir estritamente a estrutura do JSON de saída. Seja analítico e preciso.`,
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
