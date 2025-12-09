import { z } from 'genkit';

export const GenerateTaxScenariosInputSchema = z.object({
  clientType: z.enum(['Novo aberturas de empresa', 'Transferências de contabilidade']).describe('The type of client.'),
  companyName: z.string().optional().describe('The name of the client\'s company.'),
  cnpj: z.string().optional().describe('The CNPJ of the client\'s company.'),
  clientData: z.string().optional().describe('Informações financeiras e operacionais do cliente em texto livre (faturamento, etc.). Usado como fallback se os campos estruturados não forem preenchidos.'),
  documentsAsText: z.string().optional().describe('Texto consolidado transcrito de todos os documentos anexados.'),
  // Campos estruturados para maior precisão
  cnaes: z.array(z.string()).optional().describe('Lista de códigos CNAE da empresa. Essencial para Fator R e ISS.'),
  issRate: z.number().optional().describe('A alíquota de ISS a ser utilizada no cálculo, em porcentagem (ex: 4.0).'),
  payrollExpenses: z.number().optional().describe('Despesas com a folha de pagamento do cliente (CLT), sem pró-labore.'),
  rbt12: z.number().optional().describe('Receita Bruta Total dos últimos 12 meses. Se não informado, será calculado (faturamento mensal * 12).'),
  fs12: z.number().optional().describe('Folha de Salários, incluindo encargos, dos últimos 12 meses. Se não informado, será estimado pela IA.'),
  monthlyRevenue: z.number().optional().describe('Faturamento mensal informado pelo cliente. Tem prioridade sobre o valor extraído do texto.'),
  isHospitalEquivalent: z
    .boolean()
    .optional()
    .describe(
      'Flag para indicar se a empresa se enquadra nos critérios de Equiparação Hospitalar para Lucro Presumido.'
    ),
  isUniprofessionalSociety: z
    .boolean()
    .optional()
    .describe(
      'Flag para indicar se a empresa é uma Sociedade Uniprofissional (SUP) para fins de ISS Fixo.'
    ),
}).strict();
export type GenerateTaxScenariosInput = z.infer<typeof GenerateTaxScenariosInputSchema>;

export const TaxDetailSchema = z.object({
  name: z.string().describe('Nome do tributo (ex: IRPJ, CSLL, PIS, COFINS, ISS, CPP).'),
  rate: z.number().describe('Alíquota do tributo, em porcentagem (ex: 4.0).'),
  value: z.number().describe('Valor do tributo (ex: 480.00).'),
}).strict();

export const ProLaboreAnalysisSchema = z.object({
  baseValue: z.number().describe('Valor base do pró-labore utilizado no cálculo.'),
  inssValue: z.number().describe('Valor da contribuição do INSS sobre o pró-labore.'),
  irrfValue: z.number().describe('Valor do IRRF retido na fonte sobre o pró-labore.'),
  netValue: z.number().describe('Valor líquido do pró-labore após deduções.'),
}).strict();

export const ScenarioDetailSchema = z.object({
  name: z.string().describe('O nome do cenário (ex: "Simples Nacional Anexo III com Faturamento de R$ 10.000,00").'),
  scenarioRevenue: z.number().describe('O faturamento mensal para o qual este cenário foi calculado.'),
  totalTaxValue: z.number().describe('O valor total do imposto a ser pago no regime (ex: 1270.15).'),
  effectiveRate: z.number().describe('A alíquota efetiva total do regime, em porcentagem (ex: 10.75).'),
  effectiveRateOnProfit: z.number().optional().describe('A alíquota efetiva sobre o lucro (Impostos / Lucro Bruto), em porcentagem.'),
  taxCostPerEmployee: z.number().optional().describe('O custo tributário médio por funcionário CLT.'),
  taxBreakdown: z.array(TaxDetailSchema).describe('Detalhamento da composição dos tributos dentro do regime.'),
  proLaboreAnalysis: ProLaboreAnalysisSchema.describe('Análise detalhada do impacto do pró-labore.'),
  netProfitDistribution: z.number().describe('Lucro líquido disponível para distribuição ao sócio após todos os impostos e encargos.'),
  notes: z.string().describe('Observações importantes sobre o cenário, como o uso do Fator R ou o cálculo do INSS patronal.'),
}).strict();
export type ScenarioDetail = z.infer<typeof ScenarioDetailSchema>;

export const GenerateTaxScenariosOutputSchema = z.object({
  transcribedText: z.string().optional().describe('As informações financeiras e operacionais transcritas dos documentos anexados.'),
  monthlyRevenue: z.number().describe('O faturamento mensal identificado para o cliente.'),
  scenarios: z.array(ScenarioDetailSchema).describe('Uma lista de cenários tributários detalhados, incluindo projeções de receita.'),
  executiveSummary: z.string().describe('Resumo executivo em Markdown com a recomendação final sobre o melhor cenário para o faturamento atual, e análise sobre os pontos de inflexão com base nas projeções de receita. Use ** para negrito nos títulos.'),
  breakEvenAnalysis: z.string().optional().describe('Análise textual sobre os pontos de equilíbrio de faturamento entre os regimes.'),
}).strict();
export type GenerateTaxScenariosOutput = z.infer<typeof GenerateTaxScenariosOutputSchema>;
