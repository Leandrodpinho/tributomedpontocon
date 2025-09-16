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
  payrollExpenses: z.number().optional().describe('As despesas com a folha de pagamento do cliente (CLT).'),
  issRate: z.number().optional().describe('A alíquota de ISS a ser utilizada no cálculo, em porcentagem (ex: 4.0).'),
  documentsAsText: z.string().optional().describe('The consolidated transcribed text from all attached documents.'),
  clientType: z.enum(['Novo aberturas de empresa', 'Transferências de contabilidade']).describe('The type of client.'),
  companyName: z.string().optional().describe('The name of the client\'s company.'),
  cnpj: z.string().optional().describe('The CNPJ of the client\'s company.'),
});
export type GenerateTaxScenariosInput = z.infer<typeof GenerateTaxScenariosInputSchema>;

const TaxDetailSchema = z.object({
  name: z.string().describe('Nome do tributo (ex: IRPJ, CSLL, PIS, COFINS, ISS, CPP).'),
  rate: z.number().describe('Alíquota do tributo, em porcentagem (ex: 4.0).'),
  value: z.number().describe('Valor do tributo (ex: 480.00).'),
});

const ProLaboreAnalysisSchema = z.object({
  baseValue: z.number().describe('Valor base do pró-labore utilizado no cálculo.'),
  inssValue: z.number().describe('Valor da contribuição do INSS sobre o pró-labore.'),
  irrfValue: z.number().describe('Valor do IRRF retido na fonte sobre o pró-labore.'),
  netValue: z.number().describe('Valor líquido do pró-labore após deduções.'),
});

export const ScenarioDetailSchema = z.object({
  name: z.string().describe('O nome do cenário (ex: "Simples Nacional Anexo III com Faturamento de R$ 10.000,00").'),
  totalTaxValue: z.number().describe('O valor total do imposto a ser pago no regime (ex: 1270.15).'),
  effectiveRate: z.number().describe('A alíquota efetiva total do regime, em porcentagem (ex: 10.75).'),
  effectiveRateOnProfit: z.number().optional().describe('A alíquota efetiva sobre o lucro (Impostos / Lucro Bruto), em porcentagem.'),
  taxCostPerEmployee: z.number().optional().describe('O custo tributário médio por funcionário CLT.'),
  taxBreakdown: z.array(TaxDetailSchema).describe('Detalhamento da composição dos tributos dentro do regime.'),
  proLaboreAnalysis: ProLaboreAnalysisSchema.describe('Análise detalhada do impacto do pró-labore.'),
  netProfitDistribution: z.number().describe('Lucro líquido disponível para distribuição ao sócio após todos os impostos e encargos.'),
  notes: z.string().describe('Observações importantes sobre o cenário, como o uso do Fator R ou o cálculo do INSS patronal.'),
});
export type ScenarioDetail = z.infer<typeof ScenarioDetailSchema>;

const GenerateTaxScenariosOutputSchema = z.object({
  transcribedText: z.string().optional().describe('As informações financeiras e operacionais transcritas dos documentos anexados.'),
  monthlyRevenue: z.number().describe('O faturamento mensal identificado para o cliente.'),
  scenarios: z.array(ScenarioDetailSchema).describe('Uma lista de cenários tributários detalhados, incluindo projeções de receita.'),
  executiveSummary: z.string().describe('Resumo executivo em Markdown com a recomendação final sobre o melhor cenário para o faturamento atual, e análise sobre os pontos de inflexão com base nas projeções de receita. Use ** para negrito nos títulos.'),
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
{{#if companyName}}Nome da Empresa: {{{companyName}}}{{/if}}
{{#if cnpj}}CNPJ: {{{cnpj}}}{{/if}}
{{#if payrollExpenses}}Folha Salarial Bruta (CLT): {{{payrollExpenses}}}{{/if}}
{{#if issRate}}Alíquota de ISS a ser usada: {{{issRate}}}%{{else}}Alíquota de ISS a ser usada: 4% (padrão Montes Claros){{/if}}
{{#if clientData}}Dados do Cliente (texto): {{{clientData}}}{{/if}}
{{#if documentsAsText}}
Conteúdo dos Documentos Anexados:
{{{documentsAsText}}}
Primeiro, use as informações financeiras de 'clientData' e 'documentsAsText' como a fonte primária de dados. Popule o campo 'transcribedText' com o conteúdo de 'documentsAsText'.
{{/if}}

Com base em todas as informações e na legislação de 2025, execute a seguinte análise V2.2:

1.  **Análise de Faturamento:** Extraia o faturamento mensal e preencha o campo 'monthlyRevenue' (formato "R$ XX.XXX,XX"). Se o cliente for novo, assuma uma receita bruta dos últimos 12 meses (RBT12) igual ao faturamento mensal x 12. Se for transferência, use os dados fornecidos.

2.  **Geração de Cenários (Faturamento Atual e Projeções):**
    *   **Calcule os cenários para 3 níveis de faturamento:** o faturamento atual, um cenário com +20% e um com +50%.
    *   **Para cada nível de faturamento, gere os cenários tributários (Simples Nacional Anexo III/V, Lucro Presumido, e Lucro Presumido com Equiparação Hospitalar). Se uma folha salarial foi fornecida, gere cenários COM e SEM essa folha para comparar o impacto da contratação. No nome do cenário, indique claramente a situação (ex: "Simples Nacional Anexo III - Com Folha CLT").**
    *   Adicione TODOS os cenários gerados ao array 'scenarios'. No campo 'name' de cada cenário, especifique o regime, o faturamento, e se inclui folha salarial. Se o nome da empresa foi fornecido, use-o no nome do cenário (ex: "Cenário para [Nome da Empresa]: Simples Nacional...").
    *   **Para cada cenário:**
        *   **Cálculo dos Tributos (Simples Nacional):**
            *   Calcule a Receita Bruta dos últimos 12 meses (RBT12). Para o faturamento atual, RBT12 = Faturamento Mensal * 12. Para as projeções, use a RBT12 projetada.
            *   **Calcule a Alíquota Efetiva com base na fórmula: ((RBT12 * Alíquota Nominal da faixa) - Parcela a Deduzir da faixa) / RBT12.**
            *   Calcule o valor do imposto (DAS) aplicando a alíquota efetiva sobre o faturamento mensal do cenário.
            *   Nas 'notes', explique o cálculo da alíquota efetiva (ex: "Alíquota Efetiva calculada com base na RBT12 de R$ XXX.XXX,XX, usando a alíquota nominal de X% e parcela a deduzir de R$ Y.YYY,XX.").
            *   Preencha o array 'taxBreakdown' com o detalhamento da composição do DAS, mostrando a alíquota e o valor de cada tributo que o compõe (IRPJ, CSLL, PIS, COFINS, ISS, CPP).
        *   **Cálculo dos Tributos (Lucro Presumido):** Calcule o valor de cada tributo (IRPJ, CSLL, PIS, COFINS, ISS) e, quando aplicável (folha de pagamento > 0), a CPP. No Lucro Presumido, a CPP (INSS Patronal) é de 20% sobre a folha de pagamento (CLT + pró-labore). **Para o ISS no Lucro Presumido, use a alíquota de {{{issRate}}}% informada (ou 4% se não for fornecida)**. Avise na 'notes' que a alíquota pode variar. Preencha o array 'taxBreakdown' para cada um, com nome, alíquota e valor.
        *   **Cálculo (Lucro Presumido com Equiparação Hospitalar):** Crie um cenário adicional com o nome "Lucro Presumido - Equiparação Hospitalar". A diferença principal é a base de cálculo para IRPJ (8% sobre o faturamento) e CSLL (12% sobre o faturamento), em vez dos 32% padrão. PIS e COFINS não mudam. Recalcule os valores de IRPJ e CSLL e o total de impostos para este cenário. Nas 'notes', explique que este benefício se aplica a serviços médicos específicos (cite exemplos) e requer organização societária como sociedade empresária limitada.
        *   **Análise do Pró-Labore (Base 2025):**
            *   **Estratégia do Fator R (Simples Nacional):** Determine o pró-labore *mínimo* necessário para que a folha total (CLT + pró-labore) alcance 28% do faturamento, permitindo a tributação pelo Anexo III.
            *   **Definição do Pró-Labore:** No cenário do Anexo III, use este pró-labore calculado. Nos outros cenários (Anexo V, Lucro Presumido), use o pró-labore mínimo legal (salário mínimo nacional projetado para 2025 de R$ 1.518,00). Na 'notes', explique a estratégia usada.
            *   **Cálculo de Encargos do Sócio:** Para o valor de pró-labore definido, calcule o INSS (11%) e o IRRF (conforme tabela progressiva de 2025). Preencha 'proLaboreAnalysis' com os valores base, INSS, IRRF e o valor líquido.
        *   **Totalização:** Calcule e preencha 'totalTaxValue' e 'effectiveRate'.
        *   **Lucro Líquido Final (Distribuição de Lucros):** Calcule o 'netProfitDistribution': Faturamento - (Soma de todos os impostos da empresa) - (Valor Bruto do Pró-Labore). A folha de pagamento de funcionários (CLT) **NÃO DEVE** ser deduzida neste campo.
        *   **Notas:** Ao detalhar os custos da folha, mencione nas notas quais encargos (ex: INSS patronal, FGTS) foram considerados além do salário bruto.
        *   **Indicadores Financeiros:** Calcule e preencha os seguintes campos:
            *   'effectiveRateOnProfit': (Impostos Totais da Empresa / Lucro Bruto Antes dos Impostos da Empresa) * 100.
            *   'taxCostPerEmployee': Se houver folha CLT, calcule (Impostos Totais da Empresa / Número de funcionários). Assuma 1 funcionário se o valor da folha for > 0, a menos que especificado.

3.  **Resumo Executivo e Análise de Projeção:** No campo 'executiveSummary', escreva uma análise concisa e minimalista em tópicos, usando **Markdown para formatar os títulos em negrito**. O layout deve ser limpo e direto ao ponto.
    *   **Recomendação para o Cenário Atual:** Indique o regime mais vantajoso para o faturamento atual (em R$ e %), de forma direta.
    *   **Análise das Projeções:** Apresente os pontos de inflexão de faturamento onde um regime se torna mais vantajoso que o outro.
    *   **Pontos de Atenção:** Liste brevemente os pontos importantes, como a alíquota de ISS e a elegibilidade para benefícios fiscais.

Sua resposta deve seguir estritamente a estrutura do JSON de saída. Seja analítico e preciso.`,
});

const generateTaxScenariosFlow = ai.defineFlow(
  {
    name: 'generateTaxScenariosFlow',
    inputSchema: GenerateTaxScenariosInputSchema,
    outputSchema: GenerateTaxScenariosOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('A IA não retornou uma saída válida.');
      }
      return output;
    } catch (error) {
      console.error('Erro ao gerar cenários tributários:', error);
      throw new Error(`Falha na geração dos cenários tributários: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
