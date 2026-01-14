/**
 * Calculadora de Impactos da Reforma Tributária
 * Converte cenários atuais para CBS + IBS e calcula impacto
 */

import type { TaxScenarioResult } from '@/lib/tax-calculator';
import type {
    ReformScenario,
    ImpactComparison,
    ImpactReport,
    ReformRates
} from '@/types/reform-impact';

// ============================================================================
// CONSTANTES DA REFORMA
// ============================================================================

/**
 * Alíquotas estimadas da reforma (baseadas em LC 214/2025)
 */
export const REFORM_RATES: ReformRates = {
    standardRate: {
        cbs: 8.5,       // Contribuição sobre Bens e Serviços (federal)
        ibs: 8.5,       // Imposto sobre Bens e Serviços (estadual/municipal)
        total: 17.0,    // Total padrão
    },
    differentiatedRegimes: {
        saude: 0.60,            // 60% de redução
        educacao: 0.60,
        transporte: 0.60,
        cultura: 0.60,
        agropecuaria: 0.40,     // 40% de redução (variável)
    },
    cestaBasica: [
        'Arroz', 'Feijão', 'Leite', 'Pão', 'Carne', 'Frango',
        'Óleo', 'Açúcar', 'Café', 'Manteiga', 'Farinha'
    ],
    cashback: {
        cbs: 0.20,              // 20% de devolução
        ibs: 0.20,
        eligibility: 'CadÚnico',
    },
};

/**
 * Cronograma de transição (2026-2033)
 */
export const TRANSITION_TIMELINE = [
    {
        year: 2026,
        phase: 'Ano-Teste (Opcional)',
        description: 'Empresas podem optar por testar CBS/IBS em paralelo com sistema atual',
        expectedImpact: 'Sem impacto obrigatório',
        actionItems: [
            'Avaliar viabilidade de participação no teste',
            'Preparar sistemas para dupla escrituração',
        ],
    },
    {
        year: 2027,
        phase: 'Início da Transição',
        description: 'CBS entra em vigor com alíquota de 1%',
        expectedImpact: 'Aumento marginal de ~1% na carga',
        actionItems: [
            'Adaptar ERP para CBS',
            'Treinar equipe contábil',
            'Revisar precificação',
        ],
    },
    {
        year: 2029,
        phase: 'Extinção Gradual ICMS/ISS',
        description: 'Início da redução de ICMS e ISS, aumento de CBS/IBS',
        expectedImpact: 'Transição proporcional',
        actionItems: [
            'Monitorar alíquotas efetivas',
            'Ajustar fluxo de caixa (Split Payment)',
        ],
    },
    {
        year: 2032,
        phase: 'Transição Avançada',
        description: 'CBS/IBS em alíquotas próximas ao final, ICMS/ISS residuais',
        expectedImpact: 'Impacto próximo ao cenário final',
        actionItems: [
            'Validar cálculos finais',
            'Otimizar creditamento',
        ],
    },
    {
        year: 2033,
        phase: 'Reforma Completa',
        description: 'Extinção total de ICMS, ISS, PIS, COFINS. Apenas CBS e IBS',
        expectedImpact: 'Impacto total da reforma',
        actionItems: [
            'Operar 100% no novo sistema',
            'Revisar planejamento tributário',
        ],
    },
];

// ============================================================================
// FUNÇÕES DE CÁLCULO
// ============================================================================

/**
 * Calcula cenário pós-reforma (CBS + IBS) equivalente ao cenário atual
 */
export function calculateReformScenario(
    currentScenario: TaxScenarioResult,
    clientData: {
        monthlyRevenue: number;
        sector?: string;
        cnaes?: string[];
        isHealthcare?: boolean;
    }
): ReformScenario {
    const { monthlyRevenue, sector, isHealthcare } = clientData;

    // Determinar se é elegível para regime diferenciado
    const isEligibleForReduction = isHealthcare ||
        sector?.toLowerCase().includes('saúde') ||
        sector?.toLowerCase().includes('médic') ||
        sector?.toLowerCase().includes('clínica');

    // Alíquota base
    let cbsRate = REFORM_RATES.standardRate.cbs;
    let ibsRate = REFORM_RATES.standardRate.ibs;
    let reducao = 0;

    // Aplicar redução se elegível
    if (isEligibleForReduction) {
        reducao = REFORM_RATES.differentiatedRegimes.saude; // 60%
        cbsRate *= (1 - reducao);
        ibsRate *= (1 - reducao);
    }

    // Calcular tributos
    const cbs = monthlyRevenue * (cbsRate / 100);
    const ibs = monthlyRevenue * (ibsRate / 100);
    const total = cbs + ibs;
    const effectiveRate = (total / monthlyRevenue) * 100;

    return {
        name: isEligibleForReduction
            ? 'CBS + IBS (Regime Diferenciado - Saúde)'
            : 'CBS + IBS (Regime Padrão)',
        regime: isEligibleForReduction ? 'CBS+IBS (Diferenciado)' : 'CBS+IBS',
        cbs,
        ibs,
        totalTax: total,
        effectiveRate,
        splitPayment: true,
        creditamento: true,
        aliquota_padrao: REFORM_RATES.standardRate.total,
        reducao_aplicada: reducao > 0 ? reducao * 100 : undefined,
        breakdown: [
            { name: 'CBS (Federal)', value: cbs },
            { name: 'IBS (Estadual/Municipal)', value: ibs },
        ],
        notes: [
            isEligibleForReduction
                ? `Redução de ${(reducao * 100).toFixed(0)}% aplicada (setor de saúde)`
                : 'Alíquota padrão aplicada',
            'Split Payment: retenção automática no pagamento',
            'Creditamento total para clientes PJ',
            'Nota Fiscal Eletrônica unificada (padrão nacional)',
        ],
    };
}

/**
 * Compara cenário atual com cenário pós-reforma
 */
export function compareScenarios(
    current: TaxScenarioResult,
    reform: ReformScenario
): ImpactComparison {
    // Calcular diferença
    const absolute = reform.totalTax - current.totalTax;
    const percentage = (absolute / current.totalTax) * 100;
    const isIncrease = absolute > 0;

    return {
        current,
        reform,
        difference: {
            absolute,
            percentage,
            isIncrease,
            monthlyImpact: absolute,
            annualImpact: absolute * 12,
        },
        operationalChanges: {
            splitPayment: {
                applies: true,
                description: 'Tributos retidos automaticamente no momento do pagamento, melhorando fluxo de caixa',
                impact: 'positive',
            },
            creditamento: {
                applies: true,
                description: 'Clientes PJ podem creditar 100% do IBS/CBS, aumentando competitividade',
                impact: 'positive',
            },
            notaFiscal: {
                changes: [
                    'Nota Fiscal Eletrônica unificada (padrão nacional)',
                    'Simplificação de obrigações acessórias',
                    'Integração automática com Receita Federal',
                ],
            },
        },
        opportunities: [
            {
                title: 'Creditamento Total',
                description: 'Clientes PJ poderão creditar 100% do CBS/IBS, tornando seus serviços mais atrativos',
                potentialSavings: undefined,
            },
            {
                title: 'Simplificação Tributária',
                description: 'Redução de 5 tributos (ICMS, ISS, PIS, COFINS, IPI) para apenas 2 (CBS, IBS)',
            },
            {
                title: 'Fluxo de Caixa Previsível',
                description: 'Split Payment garante retenção automática, eliminando surpresas',
            },
        ],
        warnings: [
            {
                title: 'Adaptação de Sistemas',
                description: 'ERP e sistemas contábeis precisarão ser atualizados para CBS/IBS',
                severity: 'medium',
            },
            {
                title: 'Transição Gradual',
                description: 'Período de 2026-2033 com dupla escrituração e complexidade temporária',
                severity: 'medium',
            },
            {
                title: 'Treinamento Necessário',
                description: 'Equipe contábil precisará ser treinada no novo sistema tributário',
                severity: 'low',
            },
        ],
    };
}

/**
 * Gera relatório completo de impacto da reforma
 */
export function generateImpactReport(
    scenarios: TaxScenarioResult[],
    clientData: {
        companyName?: string;
        monthlyRevenue: number;
        regime?: string;
        sector?: string;
        cnaes?: string[];
    }
): ImpactReport {
    // Encontrar melhor cenário atual
    const bestCurrent = scenarios.reduce((best, current) =>
        current.totalTax < best.totalTax ? current : best
    );

    // Calcular cenário pós-reforma
    const bestReform = calculateReformScenario(bestCurrent, {
        monthlyRevenue: clientData.monthlyRevenue,
        sector: clientData.sector,
        cnaes: clientData.cnaes,
        isHealthcare: clientData.sector?.toLowerCase().includes('saúde'),
    });

    // Comparar
    const comparison = compareScenarios(bestCurrent, bestReform);

    // Gerar comparações para todos os cenários
    const allComparisons = scenarios.map(scenario => {
        const reformScenario = calculateReformScenario(scenario, clientData);
        return compareScenarios(scenario, reformScenario);
    });

    // Determinar impacto geral
    const overallImpact = comparison.difference.isIncrease ? 'negative' : 'positive';

    return {
        clientName: clientData.companyName || 'Cliente',
        analysisDate: new Date(),
        clientData: {
            monthlyRevenue: clientData.monthlyRevenue,
            currentRegime: clientData.regime || bestCurrent.name,
            sector: clientData.sector || 'Não especificado',
            cnaes: clientData.cnaes,
        },
        bestCurrentScenario: bestCurrent,
        bestReformScenario: bestReform,
        comparison,
        allComparisons,
        timeline: TRANSITION_TIMELINE,
        executiveSummary: {
            overallImpact,
            keyFindings: [
                `Regime atual: ${bestCurrent.name} - R$ ${bestCurrent.totalTax.toFixed(2)}/mês`,
                `Pós-reforma: ${bestReform.name} - R$ ${bestReform.totalTax.toFixed(2)}/mês`,
                `Impacto: ${comparison.difference.isIncrease ? 'Aumento' : 'Redução'} de R$ ${Math.abs(comparison.difference.absolute).toFixed(2)}/mês (${Math.abs(comparison.difference.percentage).toFixed(1)}%)`,
                `Economia/Custo anual: R$ ${Math.abs(comparison.difference.annualImpact).toFixed(2)}`,
            ],
            recommendations: [
                comparison.difference.isIncrease
                    ? 'Avaliar estratégias de mitigação do aumento de carga'
                    : 'Aproveitar redução de carga para investimentos',
                'Iniciar preparação de sistemas para CBS/IBS',
                'Treinar equipe contábil no novo modelo tributário',
                'Monitorar cronograma de transição (2026-2033)',
            ],
        },
    };
}
