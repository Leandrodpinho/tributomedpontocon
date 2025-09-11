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
  issRate: z.string().optional().describe('A alíquota de ISS a ser utilizada no cálculo, em porcentagem (ex: "4.0").'),
  documentsAsText: z.string().optional().describe('The consolidated transcribed text from all attached documents.'),
  clientType: z.enum(['Novo aberturas de empresa', 'Transferências de contabilidade']).describe('The type of client.'),
});
export type GenerateTaxScenariosInput = z.infer<typeof GenerateTaxScenariosInputSchema>;

const TaxDetailSchema = z.object({
  name: z.string().describe('Nome do tributo (ex: IRPJ, CSLL, PIS, COFINS, ISS, CPP).'),
  rate: z.string().describe('Alíquota do tributo (ex: "4.0").'),
  value: z.string().describe('Valor do tributo (ex: "R$ 480,00").'),
});

const ProLaboreAnalysisSchema = z.object({
  baseValue: z.string().describe('Valor base do pró-labore utilizado no cálculo.'),
  inssValue: z.string().describe('Valor da contribuição do INSS sobre o pró-labore.'),
  irrfValue: z.string().describe('Valor do IRRF retido na fonte sobre o pró-labore.'),
  netValue: z.string().describe('Valor líquido do pró-labore após deduções.'),
});

const ScenarioDetailSchema = z.object({
  name: z.string().describe('O nome do cenário (ex: "Simples Nacional Anexo III com Faturamento de R$ 10.000,00").'),
  totalTaxValue: z.string().describe('O valor total do imposto a ser pago no regime (ex: "R$ 1.270,15").'),
  effectiveRate: z.string().describe('A alíquota efetiva total do regime (ex: "10,75%").'),
  effectiveRateOnProfit: z.string().optional().describe('A alíquota efetiva sobre o lucro (Impostos / Lucro Bruto).'),
  taxCostPerEmployee: z.string().optional().describe('O custo tributário médio por funcionário CLT.'),
  taxBreakdown: z.array(TaxDetailSchema).describe('Detalhamento da composição dos tributos dentro do regime.'),
  proLaboreAnalysis: ProLaboreAnalysisSchema.describe('Análise detalhada do impacto do pró-labore.'),
  netProfitDistribution: z.string().describe('Lucro líquido disponível para distribuição ao sócio após todos os impostos e encargos.'),
  notes: z.string().describe('Observações importantes sobre o cenário, como o uso do Fator R ou o cálculo do INSS patronal.'),
});

const GenerateTaxScenariosOutputSchema = z.object({
  transcribedText: z.string().optional().describe('As informações financeiras e operacionais transcritas dos documentos anexados.'),
  monthlyRevenue: z.string().describe('O faturamento mensal identificado para o cliente.'),
  scenarios: z.array(ScenarioDetailSchema).describe('Uma lista de cenários tributários detalhados, incluindo projeções de receita.'),
  executiveSummary: z.string().describe('Resumo executivo com a recomendação final sobre o melhor cenário para o faturamento atual, e análise sobre os pontos de inflexão com base nas projeções de receita.'),
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
{{#if issRate}}Alíquota de ISS a ser usada: {{{issRate}}}%{{else}}Alíquota de ISS a ser usada: 4% (padrão Montes Claros){{/if}}
{{#if clientData}}Dados do Cliente (texto): {{{clientData}}}{{/if}}
{{#if documentsAsText}}
Conteúdo dos Documentos Anexados:
{{{documentsAsText}}}
Primeiro, use as informações financeiras de 'clientData' e 'documentsAsText' como a fonte primária de dados. Popule o campo 'transcribedText' com o conteúdo de 'documentsAsText'.
{{/if}}

Com base em todas as informações e na legislação de 2025, execute a seguinte análise V2.1:

1.  **Análise de Faturamento:** Extraia o faturamento mensal e preencha o campo 'monthlyRevenue' (formato "R$ XX.XXX,XX").

2.  **Geração de Cenários (Faturamento Atual e Projeções):**
    *   **Calcule os cenários para 3 níveis de faturamento:** o faturamento atual, um cenário com +20% e um com +50%.
    *   **Para cada nível de faturamento, gere os cenários tributários (Simples Nacional Anexo III/V, Lucro Presumido). Se uma folha salarial foi fornecida, gere cenários COM e SEM essa folha para comparar o impacto da contratação. No nome do cenário, indique claramente a situação (ex: "Simples Nacional Anexo III - Com Folha CLT").**
    *   Adicione TODOS os cenários gerados ao array 'scenarios'. No campo 'name' de cada cenário, especifique o regime, o faturamento, e se inclui folha salarial.
    *   **Para cada cenário:**
        *   **Cálculo dos Tributos:** Calcule o valor de cada tributo (IRPJ, CSLL, PIS, COFINS, ISS) e, quando aplicável (Simples Anexo III com Fator R, Lucro Presumido), a CPP. No Lucro Presumido, a CPP (INSS Patronal) é de 20% sobre a folha de pagamento (CLT + pró-labore). **Para o ISS no Lucro Presumido, use a alíquota de {{{issRate}}}% informada (ou 4% se não for fornecida)**. Avise na 'notes' que a alíquota pode variar. Preencha o array 'taxBreakdown' para cada um, com nome, alíquota e valor. Siga estritamente o formato para cada tributo.
        *   **Análise do Pró-Labore:**
            *   **Estratégia do Fator R (Simples Nacional):** Determine o pró-labore *mínimo* necessário para que a folha total (CLT + pró-labore) alcance 28% do faturamento, permitindo a tributação pelo Anexo III.
            *   **Definição do Pró-Labore:** No cenário do Anexo III, use este pró-labore calculado. Nos outros cenários (Anexo V, Lucro Presumido), use o pró-labore mínimo legal (salário mínimo nacional). Na 'notes', explique a estratégia usada.
            *   **Cálculo de Encargos do Sócio:** Para o valor de pró-labore definido, calcule o INSS (11%) e o IRRF (conforme tabela progressiva). Preencha 'proLaboreAnalysis' com os valores base, INSS, IRRF e o valor líquido.
        *   **Totalização:** Calcule e preencha 'totalTaxValue' e 'effectiveRate'.
        *   **Lucro Líquido Final (Distribuição de Lucros):** Calcule o 'netProfitDistribution': Faturamento - (Soma de todos os impostos da empresa) - (Valor Bruto do Pró-Labore).
        *   **Notas:** Ao detalhar os custos da folha, mencione nas notas quais encargos (ex: INSS patronal, FGTS) foram considerados além do salário bruto.
        *   **Indicadores Financeiros:** Calcule e preencha os seguintes campos:
            *   'effectiveRateOnProfit': (Impostos Totais da Empresa / Lucro Bruto Antes dos Impostos da Empresa) * 100.
            *   'taxCostPerEmployee': Se houver folha CLT, calcule (Impostos Totais da Empresa / Número de funcionários). Assuma 1 funcionário se o valor da folha for > 0, a menos que especificado.

3.  **Resumo Executivo e Análise de Projeção:** No campo 'executiveSummary', escreva uma análise em três partes:
    *   **Recomendação para o Cenário Atual:** Indique qual regime é mais vantajoso para o faturamento atual (em R$ e %), e por quê. Aja como um consultor. Se foi informada uma folha, compare os cenários com e sem ela, explicando o impacto financeiro da contratação, incluindo os custos totais (salário + encargos).
    *   **Análise das Projeções:** Com base nos cenários de +20% e +50%, analise os pontos de inflexão. Mostre a partir de qual faturamento o Lucro Presumido pode se tornar mais vantajoso.
    *   **Pontos de Atenção e Oportunidades:** Mencione a importância de verificar a alíquota de ISS do município do cliente. Comente sobre a possibilidade de benefícios como a equiparação hospitalar, que reduz drasticamente as bases de IRPJ e CSLL no Lucro Presumido.

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
