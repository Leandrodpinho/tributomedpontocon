'use server';

import {LEGAL_CONSTANTS_2025} from './legal-constants';
/**
 * @fileOverview Generates potential tax scenarios tailored for medical professionals and clinics.
 *
 * - generateTaxScenarios - A function that generates tax scenarios.
 * - GenerateTaxScenariosInput - The input type for the generateTaxScenarios function.
 * - GenerateTaxScenariosOutput - The return type for the generateTaxScenarios function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  GenerateTaxScenariosInput,
  GenerateTaxScenariosInputSchema,
  GenerateTaxScenariosOutput,
  GenerateTaxScenariosOutputSchema,
} from './types';

// Define an extended schema that includes the legal constants for type safety and validation within the flow.
const GenerateTaxScenariosWithConstantsInputSchema =
  GenerateTaxScenariosInputSchema.extend({
    minimumWage: z.number(),
    inssCeiling: z.number(),
  });

export async function generateTaxScenarios(input: GenerateTaxScenariosInput): Promise<GenerateTaxScenariosOutput> {
  // Injeta as constantes legais no payload que será enviado para a IA.
  const fullInput = {
    ...input,
    ...LEGAL_CONSTANTS_2025,
  };
  return generateTaxScenariosFlow(fullInput);
}

const prompt = ai.definePrompt({
  name: 'generateTaxScenariosPrompt',
  input: {schema: GenerateTaxScenariosWithConstantsInputSchema},
  output: {schema: GenerateTaxScenariosOutputSchema},
  prompt: `Você é um contador-chefe e consultor de negócios para profissionais da área médica no Brasil, um especialista com domínio completo da legislação vigente de 2025 e das jurisprudências consolidadas. Sua tarefa é criar um planejamento tributário estratégico e profundo, que sirva como ferramenta para tomada de decisão. Responda sempre em português do Brasil.

**BASE DE CONHECIMENTO LEGAL (LEGISLAÇÃO 2025):**
Você DEVE basear todos os seus cálculos e análises nas seguintes normas:
- **Simples Nacional:** Lei Complementar 123/2006 (especialmente o art. 18 e parágrafos sobre Fator R) e Resolução CGSN 140/2018 (regras de cálculo do Fator R e composição da folha de salários).
- **Lucro Presumido & Equiparação Hospitalar:** Lei 9.249/1995 (arts. 15 e 20, sobre percentuais de presunção de 32%, e a exceção de 8% para IRPJ e 12% para CSLL para serviços hospitalares). Aderir à jurisprudência do STJ (ex: REsp 951.251/PR) que define "serviços hospitalares" de forma ampla, não restrita a internações.
- **ISS Fixo (Sociedades Uniprofissionais - SUP):** Decreto-Lei 406/1968 (art. 9º, §§1º e 3º) e sua vigência confirmada pelo STJ, permitindo o regime de valor fixo por profissional para SUPs.
- **INSS:** Lei 8.212/1991. Retenção de 11% sobre pró-labore (contribuinte individual) e CPP de 20% sobre a folha para Lucro Presumido/Real. Tabela INSS 2025 com teto de R$ {{{inssCeiling}}}.
- **IRPF/IRRF:** Tabela progressiva mensal oficial de 2025 para o cálculo do IRRF sobre o pró-labore.

Você receberá dados de um cliente:
Tipo de Cliente: {{{clientType}}}
{{#if companyName}}Nome da Empresa: {{{companyName}}}{{/if}}
{{#if cnpj}}CNPJ: {{{cnpj}}}{{/if}}

**DADOS ESTRUTURADOS (Prioridade Máxima):**
{{#if cnaes}}CNAEs: {{{cnaes}}}{{/if}}
{{#if rbt12}}RBT12 (Receita Bruta 12M): {{{rbt12}}}{{/if}}
{{#if fs12}}FS12 (Folha de Salários 12M): {{{fs12}}}{{/if}}
{{#if payrollExpenses}}Folha Salarial Bruta (CLT): {{{payrollExpenses}}}{{/if}}
{{#if isHospitalEquivalent}}Equiparação Hospitalar: Sim{{/if}}
{{#if isUniprofessionalSociety}}Sociedade Uniprofissional (ISS Fixo): Sim{{/if}}
{{#if issRate}}Alíquota de ISS (ad valorem): {{{issRate}}}%{{else}}Alíquota de ISS (ad valorem): 4% (padrão){{/if}}

**DADOS NÃO ESTRUTURADOS (Fallback):**
{{#if clientData}}Texto do Cliente: {{{clientData}}}{{/if}}
{{#if documentsAsText}}
Conteúdo dos Documentos Anexados:
{{{documentsAsText}}}
{{/if}}

**INSTRUÇÕES DE EXECUÇÃO:**

**ETAPA 1: PROCESSAMENTO DE DOCUMENTOS (OBRIGATÓRIO)**
1.  Pegue TODO o conteúdo de 'documentsAsText' e coloque-o, sem alteração, no campo 'transcribedText' do JSON de saída.
2.  Se 'documentsAsText' estiver vazio, o campo 'transcribedText' deve conter a frase "Nenhum documento foi anexado para transcrição.".

**ETAPA 2: ANÁLISE E GERAÇÃO DE CENÁRIOS**
1.  **Análise de Faturamento:** Extraia o **faturamento mensal**. Dê prioridade para valores em 'clientData' ou 'documentsAsText'. Preencha 'monthlyRevenue' no JSON. Se não encontrar, retorne um erro claro.
2.  **Geração de Cenários:** Para o faturamento mensal identificado, gere TODOS os cenários aplicáveis abaixo. Se 'payrollExpenses' for fornecido, crie variações COM e SEM folha.
    *   **Simples Nacional (Anexo III vs. Anexo V):** Analise o Fator R.
    *   **Lucro Presumido (Padrão):** Base de presunção de 32%.
    *   **Lucro Presumido com Equiparação Hospitalar:** Cenário com presunção reduzida (8%/12%).
    *   **Lucro Presumido com ISS Fixo (SUP):** Se a descrição dos serviços e a estrutura societária sugerirem uma Sociedade Uniprofissional, crie este cenário.
    *   **Lucro Real (Estimativa):** Crie um cenário estimado, assumindo despesas dedutíveis. Deixe claro nas 'notes' que este é uma estimativa e depende de uma contabilidade detalhada.

**ETAPA 3: CÁLCULOS DETALHADOS POR CENÁRIO (SEGUIR REGRAS À RISCA)**
Para cada cenário gerado, preencha TODOS os campos do schema \`ScenarioDetailSchema\`.

*   **Simples Nacional:**
    *   **Fator R:** Calcule \`r = FS12 / RBT12\`. \`FS12\` (Folha de Salários 12 meses) = salários + pró-labore + 13º + INSS patronal (se Anexo IV) + FGTS. \`RBT12\` = Faturamento Mensal * 12. Se \`r >= 28%\`, use Anexo III. Senão, Anexo V.
    *   **Alíquota Efetiva:** Use a fórmula \`((RBT12 * Alíquota Nominal da faixa) - Parcela a Deduzir da faixa) / RBT12\`.
    *   **Tributos:** Detalhe a composição do DAS (IRPJ, CSLL, PIS, COFINS, ISS, CPP) em \`taxBreakdown\`. A CPP já está inclusa no DAS.

*   **Lucro Presumido (Padrão e com Equiparação):**
    *   **Base de Cálculo:** Padrão: 32% sobre o faturamento para IRPJ e CSLL. **Para Equiparação Hospitalar, ative o benefício (8% IRPJ, 12% CSLL) se \`isHospitalEquivalent\` for verdadeiro.** Se for falso ou não informado, analise o texto para decidir, mas mencione na 'notes' que a decisão foi baseada em inferência.
    *   **Tributos:** Calcule IRPJ (15% + 10% adicional se lucro > 20k/mês), CSLL (9%), PIS (0.65%), COFINS (3%). Para o ISS, use a alíquota \`ad valorem\` de \`{{{issRate}}}\`% (ou 4% padrão).
    *   **CPP (INSS Patronal):** Calcule 20% sobre a folha de pagamento (CLT + Pró-labore). Adicione este valor ao \`taxBreakdown\` e ao \`totalTaxValue\`.

*   **Lucro Presumido com ISS Fixo (SUP):**
    *   **Tributos Federais:** Calcule IRPJ, CSLL, PIS, COFINS da mesma forma que o Lucro Presumido padrão.
    *   **ISS:** **Crie este cenário APENAS se \`isUniprofessionalSociety\` for verdadeiro.** Se for, NÃO use a alíquota percentual. Assuma um valor fixo anual por sócio (ex: R$ 2.000/ano por sócio, um valor plausível) e calcule o valor mensal. Deixe claro na 'notes' que este valor é uma ESTIMATIVA e depende da legislação do MUNICÍPIO.
    *   **Requisitos:** Nas 'notes', explique que este regime é para sociedades de profissionais (ex: médicos) onde os sócios exercem a atividade pessoalmente, sem caráter empresarial, e que não é cumulativo com o Simples Nacional por padrão.

*   **Análise do Pró-Labore (para TODOS os cenários):**
    *   **Definição:** Para o Simples Nacional, defina o pró-labore mínimo para atingir o Fator R de 28% (se vantajoso). Para os demais regimes, use o salário mínimo (R$ {{{minimumWage}}}).
    *   **Encargos do Sócio:** Calcule o INSS (11% sobre o valor, limitado ao teto de R$ {{{inssCeiling}}}) e o IRRF (usando a tabela progressiva de 2025). Preencha \`proLaboreAnalysis\` com os valores base, INSS, IRRF e líquido.

*   **Resultados Finais:**
    *   Calcule \`totalTaxValue\` (soma de todos os impostos da empresa, incluindo CPP quando aplicável).
    *   Calcule \`effectiveRate\`.
    *   Calcule \`netProfitDistribution\` = Faturamento - \`totalTaxValue\` - Valor Bruto do Pró-Labore. **NÃO** deduza a folha CLT aqui.

**ETAPA 4: RESUMOS INTELIGENTES**
1.  **Resumo Executivo (\`executiveSummary\`):** Escreva uma análise concisa em tópicos no campo 'executiveSummary', usando **Markdown para formatar os títulos em negrito**.
    *   **Recomendação para o Cenário Atual:** Indique o regime mais vantajoso para o faturamento atual, com a economia em R$ e %.
    *   **Pontos de Atenção:** Liste os pontos cruciais (ex: necessidade de manter o Fator R, requisitos para Equiparação Hospitalar, verificação da lei municipal para ISS Fixo).

2.  **Análise de Ponto de Equilíbrio (\`breakEvenAnalysis\`):** Forneça uma análise textual sobre os pontos de inflexão. Exemplo: "O Lucro Presumido tende a se tornar mais vantajoso que o Simples Nacional quando o faturamento aumenta, pois sua alíquota é fixa sobre uma base presumida, enquanto a do Simples é progressiva sobre a receita total."

Sua resposta deve seguir estritamente a estrutura do JSON de saída. Seja analítico, preciso e aja como o especialista que você é.`,
});

const generateTaxScenariosFlow = ai.defineFlow(
  {
    name: 'generateTaxScenariosFlow',
    inputSchema: GenerateTaxScenariosWithConstantsInputSchema,
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
      // Log aprimorado para depuração em produção
      console.error('Erro crítico ao gerar cenários tributários. Input que causou o erro:', JSON.stringify(input, null, 2));
      console.error('Detalhes do erro:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Re-lança um erro para o frontend, mantendo os detalhes sensíveis no log do servidor.
      throw new Error(`Falha na geração dos cenários tributários: ${errorMessage}`);
    }
  }
);
