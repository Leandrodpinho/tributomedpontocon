'use server';

/**
 * @fileOverview Generates potential tax scenarios tailored for medical professionals and clinics.
 *
 * - generateTaxScenarios - A function that generates tax scenarios.
 * - GenerateTaxScenariosInput - The input type for the generateTaxScenarios function.
 * - GenerateTaxScenariosOutput - The return type for the generateTaxScenarios function.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateTaxScenariosInput,
  GenerateTaxScenariosInputSchema,
  GenerateTaxScenariosOutput,
  GenerateTaxScenariosOutputSchema,
} from './types';


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

1.  **Geração de Cenários (Faturamento Atual e Projeções):**
    *   **Calcule os cenários para 3 níveis de faturamento:** o faturamento atual, um cenário com +20% e um com +50%.
    *   **Para cada nível de faturamento, gere os cenários tributários (Simples Nacional Anexo III/V, Lucro Presumido, e Lucro Presumido com Equiparação Hospitalar). Se uma folha salarial foi fornecida, gere cenários COM e SEM essa folha para comparar o impacto da contratação. No nome do cenário, indique claramente a situação (ex: "Simples Nacional Anexo III - Com Folha CLT").**
    *   Adicione TODOS os cenários gerados ao array 'scenarios'. No campo 'name' de cada cenário, especifique o regime e o faturamento. Preencha o campo 'scenarioRevenue' com o valor numérico do faturamento para este cenário específico. Se o nome da empresa foi fornecido, use-o no nome do cenário (ex: "Cenário para [Nome da Empresa]: Simples Nacional...").
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

2.  **Definição do Faturamento Base:** Após gerar todos os cenários, popule o campo 'monthlyRevenue' no nível raiz do JSON com o valor do campo 'scenarioRevenue' do primeiro cenário da lista. Isso garante que o faturamento base da análise corresponda ao primeiro grupo de cenários.

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
