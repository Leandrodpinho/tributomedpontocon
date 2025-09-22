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
  prompt: `Você é um contador-chefe e consultor de negócios para profissionais da área médica no Brasil, especialista na legislação vigente de 2025. Sua tarefa é criar um planejamento tributário preciso para um faturamento específico. Responda sempre em português do Brasil.

Você receberá dados de um cliente:
Tipo de Cliente: {{{clientType}}}
{{#if companyName}}Nome da Empresa: {{{companyName}}}{{/if}}
{{#if cnpj}}CNPJ: {{{cnpj}}}{{/if}}
{{#if payrollExpenses}}Folha Salarial Bruta (CLT): {{{payrollExpenses}}}{{/if}}
{{#if issRate}}Alíquota de ISS a ser usada: {{{issRate}}}%{{else}}Alíquota de ISS a ser usada: 4% (padrão){{/if}}
{{#if clientData}}Dados do Cliente (texto): {{{clientData}}}{{/if}}
{{#if documentsAsText}}
Conteúdo dos Documentos Anexados:
{{{documentsAsText}}}
{{/if}}

**INSTRUÇÃO MAIS IMPORTANTE:** Sua primeira e mais crucial tarefa é lidar com os documentos.
1.  Pegue TODO o conteúdo de 'documentsAsText' e coloque-o, sem alteração, no campo 'transcribedText' do JSON de saída.
2.  Se 'documentsAsText' estiver vazio, o campo 'transcribedText' deve conter a frase "Nenhum documento foi anexado para transcrição.".
Esta etapa é obrigatória e deve ser executada antes de qualquer outra análise.

Agora, com base em todas as informações fornecidas (incluindo o texto que você acabou de transcrever), execute a seguinte análise:

1.  **Análise de Faturamento:**
    *   Analise 'clientData' e o texto transcrito para identificar o **faturamento mensal** do cliente. Este é o único faturamento que você deve analisar.
    *   Preencha o campo 'monthlyRevenue' no nível raiz do JSON com este valor numérico. Se não conseguir identificar um faturamento, retorne um erro.

2.  **Geração de Cenários (Faturamento Único):**
    *   Para o faturamento mensal identificado, gere os seguintes cenários tributários: Simples Nacional (Anexo III e V, considerando o Fator R), Lucro Presumido, e Lucro Presumido com Equiparação Hospitalar.
    *   Se um valor para 'payrollExpenses' foi fornecido, gere variações dos cenários COM e SEM essa folha para demonstrar o impacto. No nome do cenário, seja claro (ex: "Simples Nacional Anexo III - Com Folha CLT").
    *   Adicione TODOS os cenários gerados ao array 'scenarios'. No campo 'name' de cada cenário, especifique o regime e o faturamento. Preencha o campo 'scenarioRevenue' com o valor numérico do faturamento para este cenário específico. Se o nome da empresa foi fornecido, use-o no nome do cenário (ex: "Cenário para [Nome da Empresa]: Simples Nacional...").

3.  **Cálculos Detalhados por Cenário:**
    *   **Simples Nacional:** Calcule a RBT12 (Faturamento Mensal * 12). Calcule a Alíquota Efetiva pela fórmula: ((RBT12 * Alíquota Nominal) - Parcela a Deduzir) / RBT12. Explique o cálculo nas 'notes'. Detalhe a composição do DAS no 'taxBreakdown'.
    *   **Lucro Presumido:** Calcule IRPJ, CSLL, PIS, COFINS, e ISS (usando a alíquota de {{{issRate}}}% ou 4% padrão). Se houver folha de pagamento (CLT + pró-labore), adicione a CPP (20% sobre a folha). Detalhe tudo em 'taxBreakdown'.
    *   **Lucro Presumido (Equiparação Hospitalar):** Crie este cenário com bases de cálculo reduzidas para IRPJ (8%) e CSLL (12%). Explique os requisitos nas 'notes'.
    *   **Análise do Pró-Labore (Base 2025):** Para o Simples Nacional, calcule o pró-labore mínimo para atingir o Fator R (28%) e se enquadrar no Anexo III. Para os outros regimes, use o salário mínimo (R$ 1.518,00). Calcule os encargos do sócio (INSS 11% e IRRF) e preencha 'proLaboreAnalysis'.
    *   **Resultados Finais:** Calcule 'totalTaxValue', 'effectiveRate', e o 'netProfitDistribution' (Faturamento - Impostos da Empresa - Pró-Labore Bruto). A folha CLT **NÃO** entra na conta do 'netProfitDistribution'.

4.  **Resumo Executivo:** No campo 'executiveSummary', escreva uma análise concisa em tópicos, usando **Markdown para formatar os títulos em negrito**.
    *   **Recomendação para o Cenário Atual:** Indique o regime mais vantajoso para o faturamento atual (em R$ e %), de forma direta.
    *   **Pontos de Atenção:** Liste brevemente os pontos importantes, como a alíquota de ISS e a elegibilidade para benefícios fiscais.

5.  **Análise de Ponto de Equilíbrio:** No campo 'breakEvenAnalysis', retorne a seguinte frase: "N/A para análise de faturamento único."

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
