/**
 * Função para calcular impacto da Reforma Tributária
 */

import type { ReformImpactAnalysis } from '@/types/reform';
import type { GenerateTaxScenariosOutput } from '@/ai/flows/types';
import { REFORM_TIMELINE } from './reform-knowledge';

export function calculateReformImpact(
    analysis: GenerateTaxScenariosOutput,
    regime_atual: string
): ReformImpactAnalysis {
    const monthlyRevenue = analysis.monthlyRevenue || 0;

    // Estimativas baseadas no regime atual
    const carga_atual = estimateCurrentTaxBurden(regime_atual, monthlyRevenue, analysis);

    // Projeção 2026 (ano-teste)
    const cbs_teste = monthlyRevenue * 0.009; // 0.9%
    const ibs_teste = monthlyRevenue * 0.001; // 0.1%
    const compensacao = cbs_teste + ibs_teste; // Pode compensar com PIS/Cofins

    // Projeção 2027 (CBS plena - estimativa 12%)
    const cbs_2027 = monthlyRevenue * 0.12;

    // Projeção 2033 (modelo final - estimativa CBS 12% + IBS 14.5%)
    const cbs_2033 = monthlyRevenue * 0.12;
    const ibs_2033 = monthlyRevenue * 0.145;
    const total_2033 = cbs_2033 + ibs_2033;

    // Transição gradual 2029-2032
    const transicao_ibs = [];
    for (let ano = 2029; ano <= 2032; ano++) {
        const anos_desde_inicio = ano - 2029 + 1;
        const reducao_percentual = anos_desde_inicio * 10; // 10%, 20%, 30%, 40%

        const icms_restante = carga_atual.icms ? carga_atual.icms * (1 - reducao_percentual / 100) : 0;
        const iss_restante = carga_atual.iss ? carga_atual.iss * (1 - reducao_percentual / 100) : 0;
        const ibs_parcial = ibs_2033 * (reducao_percentual / 100);

        transicao_ibs.push({
            ano,
            icms_percentual: 100 - reducao_percentual,
            iss_percentual: 100 - reducao_percentual,
            ibs_percentual: reducao_percentual,
            carga_total_estimada: cbs_2027 + icms_restante + iss_restante + ibs_parcial
        });
    }

    // Gerar recomendações
    const recomendacoes = generateRecommendations(regime_atual, carga_atual.total, total_2033);
    const alertas = generateAlerts(regime_atual, carga_atual.total, total_2033);

    return {
        regime_atual,
        faturamento_mensal: monthlyRevenue,

        carga_atual: {
            pis_cofins: carga_atual.pis_cofins,
            icms: carga_atual.icms,
            iss: carga_atual.iss,
            total: carga_atual.total
        },

        projecao_2026: {
            cbs_teste,
            ibs_teste,
            compensacao_pis_cofins: compensacao,
            impacto_liquido: 0 // Neutro no ano-teste
        },

        projecao_2027: {
            cbs: cbs_2027,
            imposto_seletivo: 0,
            total: cbs_2027
        },

        transicao_ibs,

        projecao_2033: {
            cbs: cbs_2033,
            ibs: ibs_2033,
            total: total_2033,
            diferenca_vs_atual: total_2033 - carga_atual.total,
            percentual_mudanca: ((total_2033 - carga_atual.total) / carga_atual.total) * 100
        },

        recomendacoes,
        alertas
    };
}

function estimateCurrentTaxBurden(regime: string, revenue: number, analysis: GenerateTaxScenariosOutput) {
    // Tentar extrair da análise existente
    const currentScenario = analysis.scenarios?.find(s =>
        s.name.toLowerCase().includes(regime.toLowerCase())
    );

    if (currentScenario) {
        return {
            pis_cofins: currentScenario.taxBreakdown?.find(t => t.name.includes('PIS') || t.name.includes('COFINS'))?.value || 0,
            icms: currentScenario.taxBreakdown?.find(t => t.name.includes('ICMS'))?.value,
            iss: currentScenario.taxBreakdown?.find(t => t.name.includes('ISS'))?.value,
            total: currentScenario.totalTaxValue || 0
        };
    }

    // Estimativas padrão por regime
    if (regime.toLowerCase().includes('simples')) {
        const aliquota = revenue <= 180000 ? 0.06 : 0.112; // Anexo III ou V
        return {
            pis_cofins: 0,
            total: revenue * aliquota
        };
    }

    if (regime.toLowerCase().includes('presumido')) {
        return {
            pis_cofins: revenue * 0.0365, // 3.65%
            iss: revenue * 0.05, // 5% estimado
            total: revenue * 0.0865
        };
    }

    // Lucro Real (estimativa conservadora)
    return {
        pis_cofins: revenue * 0.0925, // 9.25%
        icms: revenue * 0.12, // 12% estimado
        total: revenue * 0.2125
    };
}

function generateRecommendations(regime: string, carga_atual: number, carga_futura: number): string[] {
    const recomendacoes: string[] = [];

    const aumento = carga_futura > carga_atual;
    const percentual = Math.abs(((carga_futura - carga_atual) / carga_atual) * 100);

    if (aumento && percentual > 10) {
        recomendacoes.push('⚠️ Prepare-se para aumento significativo da carga tributária a partir de 2027');
        recomendacoes.push('💰 Considere revisar precificação e margens de lucro');
        recomendacoes.push('📊 Avalie migração de regime tributário antes de 2027');
    }

    if (regime.toLowerCase().includes('simples')) {
        recomendacoes.push('🔄 Avalie opção pelo Regime Híbrido no Simples para transferir créditos plenos aos clientes');
        recomendacoes.push('📈 Clientes B2B podem preferir fornecedores que geram crédito de CBS/IBS');
    }

    recomendacoes.push('💻 Prepare sistemas para Split Payment - o imposto será retido automaticamente');
    recomendacoes.push('📚 Capacite equipe sobre creditamento amplo e novas regras');
    recomendacoes.push('🔍 Revise contratos de fornecimento considerando o novo modelo de créditos');

    return recomendacoes;
}

function generateAlerts(regime: string, carga_atual: number, carga_futura: number) {
    const alertas: Array<{
        tipo: 'atencao' | 'oportunidade' | 'risco';
        titulo: string;
        descricao: string;
    }> = [];

    const diferenca = carga_futura - carga_atual;

    if (diferenca > carga_atual * 0.1) {
        alertas.push({
            tipo: 'risco',
            titulo: 'Aumento Significativo Previsto',
            descricao: `A carga tributária pode aumentar em ${((diferenca / carga_atual) * 100).toFixed(1)}% até 2033. Planeje ajustes financeiros.`
        });
    }

    if (diferenca < 0) {
        alertas.push({
            tipo: 'oportunidade',
            titulo: 'Redução de Carga Tributária',
            descricao: `Estimativa de redução de ${Math.abs((diferenca / carga_atual) * 100).toFixed(1)}% na carga total.`
        });
    }

    alertas.push({
        tipo: 'atencao',
        titulo: 'Split Payment em 2027',
        descricao: 'O imposto será retido automaticamente nas transações bancárias. Ajuste fluxo de caixa.'
    });

    if (regime.toLowerCase().includes('simples')) {
        alertas.push({
            tipo: 'oportunidade',
            titulo: 'Regime Híbrido Disponível',
            descricao: 'Empresas do Simples podem optar por CBS/IBS no regime regular mantendo outros tributos no Simples.'
        });
    }

    return alertas;
}
