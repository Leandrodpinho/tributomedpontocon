/**
 * Tipos TypeScript para Análise de Impactos da Reforma Tributária
 */

import type { TaxScenarioResult } from '@/lib/tax-calculator';

/**
 * Cenário tributário pós-reforma (CBS + IBS)
 */
export interface ReformScenario {
    name: string;
    regime: 'CBS+IBS' | 'CBS+IBS (Diferenciado)' | 'CBS+IBS (Cesta Básica)';

    // Tributos pós-reforma
    cbs: number;                    // Contribuição sobre Bens e Serviços (federal)
    ibs: number;                    // Imposto sobre Bens e Serviços (estadual/municipal)
    imposto_seletivo?: number;      // Imposto Seletivo (produtos específicos)

    // Totais
    totalTax: number;
    effectiveRate: number;

    // Características
    splitPayment: boolean;          // Retenção automática
    creditamento: boolean;          // Não-cumulatividade
    aliquota_padrao: number;        // Alíquota padrão (CBS + IBS)
    reducao_aplicada?: number;      // % de redução (regimes diferenciados)

    // Detalhes
    breakdown: {
        name: string;
        value: number;
    }[];
    notes: string[];
}

/**
 * Comparação entre cenário atual e pós-reforma
 */
export interface ImpactComparison {
    // Cenários
    current: TaxScenarioResult;
    reform: ReformScenario;

    // Diferença financeira
    difference: {
        absolute: number;           // R$ de diferença (positivo = aumento, negativo = redução)
        percentage: number;         // % de diferença
        isIncrease: boolean;        // true = aumento de carga, false = redução
        monthlyImpact: number;      // Impacto mensal em R$
        annualImpact: number;       // Impacto anual em R$
    };

    // Mudanças operacionais
    operationalChanges: {
        splitPayment: {
            applies: boolean;
            description: string;
            impact: 'positive' | 'neutral' | 'negative';
        };
        creditamento: {
            applies: boolean;
            description: string;
            impact: 'positive' | 'neutral' | 'negative';
        };
        notaFiscal: {
            changes: string[];
        };
    };

    // Oportunidades
    opportunities: {
        title: string;
        description: string;
        potentialSavings?: number;
    }[];

    // Alertas
    warnings: {
        title: string;
        description: string;
        severity: 'low' | 'medium' | 'high';
    }[];
}

/**
 * Relatório completo de impacto da reforma
 */
export interface ImpactReport {
    // Metadados
    clientName: string;
    analysisDate: Date;

    // Dados do cliente
    clientData: {
        monthlyRevenue: number;
        currentRegime: string;
        sector: string;
        cnaes?: string[];
    };

    // Melhor cenário atual
    bestCurrentScenario: TaxScenarioResult;

    // Melhor cenário pós-reforma
    bestReformScenario: ReformScenario;

    // Comparação detalhada
    comparison: ImpactComparison;

    // Todos os cenários calculados
    allComparisons: ImpactComparison[];

    // Cronograma de transição
    timeline: {
        year: number;
        phase: string;
        description: string;
        expectedImpact: string;
        actionItems: string[];
    }[];

    // Resumo executivo
    executiveSummary: {
        overallImpact: 'positive' | 'neutral' | 'negative';
        keyFindings: string[];
        recommendations: string[];
    };
}

import type { ScenarioDetail } from '@/ai/flows/types';

/**
 * Dados salvos no localStorage
 */
export interface SavedTaxAnalysis {
    timestamp: Date;
    clientData: {
        companyName?: string;
        monthlyRevenue: number;
        regime?: string;
        cnaes?: string[];
    };
    scenarios: ScenarioDetail[];
    reformImpact?: ImpactReport;
}

/**
 * Configuração de alíquotas da reforma
 */
export interface ReformRates {
    // Alíquota padrão (estimada)
    standardRate: {
        cbs: number;        // ~8.5%
        ibs: number;        // ~8.5%
        total: number;      // ~17%
    };

    // Regimes diferenciados
    differentiatedRegimes: {
        saude: number;              // 60% de redução
        educacao: number;           // 60% de redução
        transporte: number;         // 60% de redução
        cultura: number;            // 60% de redução
        agropecuaria: number;       // Variável
    };

    // Cesta básica (alíquota zero)
    cestaBasica: string[];          // Lista de produtos

    // Cashback
    cashback: {
        cbs: number;                // % de devolução CBS
        ibs: number;                // % de devolução IBS
        eligibility: string;
    };
}
