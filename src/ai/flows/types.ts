import { z } from 'zod';

export const GenerateTaxScenariosInputSchema = z.object({
  clientType: z.enum(['Novo aberturas de empresa', 'Transferências de contabilidade']).describe('The type of client.'),
  companyName: z.string().optional().describe('The name of the client\'s company.'),
  cnpj: z.string().optional().describe('The CNPJ of the client\'s company.'),
  clientData: z.string().optional().describe('Informações financeiras e operacionais do cliente em texto livre (faturamento, etc.). Usado como fallback se os campos estruturados não forem preenchidos.'),
  documentsAsText: z.string().optional().describe('Texto consolidado transcrito de todos os documentos anexados.'),
  // Campos estruturados para maior precisão
  activities: z.array(z.object({
    name: z.string().describe('Nome da atividade (ex: Venda de Mercadorias, Serviços Médicos).'),
    revenue: z.number().describe('Faturamento mensal desta atividade.'),
    type: z.enum(['commerce', 'service', 'industry']).describe('Tipo da atividade para fins de base de cálculo (Presumido).'),
    simplesAnexo: z.enum(['I', 'II', 'III', 'IV', 'V']).describe('Anexo do Simples Nacional aplicável.'),
    isMeiEligible: z.boolean().describe('Se esta atividade é permitida no MEI.'),
  })).optional().describe('Lista de atividades exercidas pela empresa com suas respectivas receitas.'),
  cnaes: z.array(z.string()).optional().describe('Lista de códigos CNAE da empresa. Essencial para Fator R e ISS.'),
  issRate: z.number().optional().describe('A alíquota de ISS a ser utilizada no cálculo, em porcentagem (ex: 4.0).'),
  payrollExpenses: z.number().optional().describe('Despesas com a folha de pagamento do cliente (CLT), sem pró-labore.'),
  rbt12: z.number().optional().describe('Receita Bruta Total dos últimos 12 meses. Se não informado, será calculado (faturamento mensal * 12).'),
  fs12: z.number().optional().describe('Folha de Salários, incluindo encargos, dos últimos 12 meses. Se não informado, será estimado pela IA.'),
  monthlyRevenue: z.number().optional().describe('Faturamento mensal TOTAL informado pelo cliente. Soma das atividades.'),
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
  numberOfPartners: z.number().optional().describe('Número de sócios profissionais (para cálculo de ISS Fixo em SUP).'),
}).strict();
export type GenerateTaxScenariosInput = z.infer<typeof GenerateTaxScenariosInputSchema>;

export const TaxDetailSchema = z.object({
  name: z.string().describe('Nome do tributo (ex: IRPJ, CSLL, PIS, COFINS, ISS, CPP).'),
  rate: z.coerce.number().describe('Alíquota do tributo, em porcentagem (ex: 4.0).'),
  value: z.coerce.number().describe('Valor do tributo (ex: 480.00).'),
}).strict();

export const ProLaboreAnalysisSchema = z.object({
  baseValue: z.coerce.number().describe('Valor base do pró-labore utilizado no cálculo.'),
  inssValue: z.coerce.number().describe('Valor da contribuição do INSS sobre o pró-labore.'),
  irrfValue: z.coerce.number().describe('Valor do IRRF retido na fonte sobre o pró-labore.'),
  netValue: z.coerce.number().describe('Valor líquido do pró-labore após deduções.'),
}).strict();

export const ScenarioDetailSchema = z.object({
  name: z.string().describe('O nome do cenário (ex: "Simples Nacional Anexo III com Faturamento de R$ 10.000,00").'),
  scenarioRevenue: z.coerce.number().optional().describe('O faturamento mensal para o qual este cenário foi calculado.'),
  scenarioCategory: z.enum(['pf', 'pj']).optional().describe('Categoria: Pessoa Física (pf) ou Jurídica (pj).'),
  scenarioType: z.enum([
    'mei',
    'carne_leao',
    'clt',
    'simples_anexo_i',
    'simples_anexo_ii',
    'simples_anexo_iii',
    'simples_anexo_iv',
    'simples_anexo_v',
    'simples_misto',
    'presumido',
    'presumido_uniprofissional',
    'presumido_hospitalar',
    'lucro_real'
  ]).optional().describe('Tipo específico do cenário para agrupamento.'),
  isEligible: z.boolean().optional().describe('Se o cliente atende aos requisitos para este cenário.'),
  eligibilityNote: z.string().optional().describe('Nota explicando os requisitos ou o que precisa para se tornar elegível.'),
  totalTaxValue: z.coerce.number().optional().describe('O valor total do imposto a ser pago no regime (ex: 1270.15).'),
  effectiveRate: z.coerce.number().optional().describe('A alíquota efetiva total do regime, em porcentagem (ex: 10.75).'),
  effectiveRateOnProfit: z.coerce.number().optional().describe('A alíquota efetiva sobre o lucro (Impostos / Lucro Bruto), em porcentagem.'),
  taxCostPerEmployee: z.coerce.number().optional().describe('O custo tributário médio por funcionário CLT.'),
  taxBreakdown: z.array(TaxDetailSchema).optional().describe('Detalhamento da composição dos tributos dentro do regime.'),
  proLaboreAnalysis: ProLaboreAnalysisSchema.optional().describe('Análise detalhada do impacto do pró-labore.'),
  netProfitDistribution: z.coerce.number().optional().describe('Lucro líquido disponível para distribuição ao sócio após todos os impostos e encargos.'),
  notes: z.string().optional().describe('Observações importantes sobre o cenário, como o uso do Fator R ou o cálculo do INSS patronal.'),
}).strict();
export type ScenarioDetail = z.infer<typeof ScenarioDetailSchema>;

export const ComplianceAlertSchema = z.object({
  type: z.enum(['danger', 'warning', 'info', 'opportunity']).describe('Nível de severidade do alerta.'),
  title: z.string().describe('Título curto do alerta (ex: "Risco de Equiparação Ilegal").'),
  description: z.string().describe('Explicação detalhada do problema ou oportunidade encontrada.'),
  suggestion: z.string().optional().describe('Ação recomendada para resolver o problema (ex: "Incluir CNAE 8599-6/04").'),
}).strict();

export const ComplianceAnalysisSchema = z.object({
  cnaeValidation: z.array(z.string()).describe(
    'Lista de validações cruzadas entre os CNAEs registrados e as atividades descritas nos documentos. ' +
    'Cada item deve indicar se o CNAE está adequado ou se há divergências. ' +
    'Exemplo: "CNAE 8630-5/04 (Atividade médica ambulatorial) está adequado para clínica médica"'
  ),
  naturezaJuridicaCheck: z.string().describe(
    'Análise DETALHADA da compatibilidade entre a natureza jurídica identificada (EI, EIRELI, LTDA, SLU, etc.) e as atividades exercidas. ' +
    'OBRIGATÓRIO incluir: ' +
    '1) Qual é a natureza jurídica identificada nos documentos; ' +
    '2) Se ela é compatível com a atividade (ex: EI não pode ter sócios, médicos não podem ser EI por risco de responsabilidade ilimitada); ' +
    '3) Recomendação específica se houver incompatibilidade. ' +
    'Exemplo: "Identificada natureza jurídica EIRELI. Compatível com atividade médica uniprofissional. Recomendação: Considerar migração para SLU (Sociedade Limitada Unipessoal) que oferece mesmas vantagens com menos burocracia."'
  ),
  alerts: z.array(ComplianceAlertSchema).describe(
    'Lista de riscos, alertas e oportunidades detectadas na análise. ' +
    'Priorize alertas de alto impacto: incompatibilidades legais, riscos fiscais, oportunidades de economia.'
  ),
}).strict();
export type ComplianceAnalysis = z.infer<typeof ComplianceAnalysisSchema>;

export const GenerateTaxScenariosOutputSchema = z.object({
  transcribedText: z.string().optional().describe('As informações financeiras e operacionais transcritas dos documentos anexados.'),
  monthlyRevenue: z.coerce.number().describe('O faturamento mensal total identificado.'),
  activities: z.array(z.object({
    name: z.string(),
    revenue: z.number(),
    type: z.enum(['commerce', 'service', 'industry']),
    simplesAnexo: z.enum(['I', 'II', 'III', 'IV', 'V']),
    isMeiEligible: z.boolean(),
  })).optional().describe('Lista detalhada de atividades extraídas.'),
  scenarios: z.array(ScenarioDetailSchema).describe('Uma lista de cenários tributários detalhados, incluindo projeções de receita.'),
  executiveSummary: z.string().optional().describe('Resumo executivo em Markdown com a recomendação final sobre o melhor cenário para o faturamento atual, e análise sobre os pontos de inflexão com base nas projeções de receita. Use ** para negrito nos títulos.'),
  breakEvenAnalysis: z.string().optional().describe('Análise textual sobre os pontos de equilíbrio de faturamento entre os regimes.'),
  complianceAnalysis: ComplianceAnalysisSchema.optional().describe('Auditoria de compliance tributário e societário baseada nos dados fornecidos.'),
  reformImpact: z.any().optional().describe('Relatório de impacto da Reforma Tributária (injetado pós-processamento).'),
}).strict();
export type GenerateTaxScenariosOutput = z.infer<typeof GenerateTaxScenariosOutputSchema>;
