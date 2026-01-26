/**
 * Hook React para gerenciar Análise de Impactos da Reforma Tributária
 */

'use client';

import { useState, useEffect } from 'react';
import type { ImpactReport, SavedTaxAnalysis } from '@/types/reform-impact';
import { generateImpactReport } from '@/lib/reform-impact-calculator';
import type { GenerateTaxScenariosOutput } from '@/ai/flows/types';
import type { TaxScenarioResult } from '@/lib/tax-calculator';

const STORAGE_KEY = 'last_tax_analysis';

export function useReformImpact() {
    const [impactReport, setImpactReport] = useState<ImpactReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadImpactReport();
    }, []);

    const loadImpactReport = () => {
        try {
            setLoading(true);
            setError(null);

            // Carregar do sessionStorage (sincronizado com dashboard-results)
            const stored = sessionStorage.getItem(STORAGE_KEY);

            if (!stored) {
                setImpactReport(null);
                setLoading(false);
                return;
            }

            const data: SavedTaxAnalysis = JSON.parse(stored);

            // Verificar se tem relatório de impacto
            // O dashboard-results salva o objeto inteiro em 'analysis'
            // Precisamos verificar se 'analysis.reformImpact' existe ou se precisamos gerar na hora
            // O dashboard salva: { analysis, clientName, timestamp }
            // O type SavedTaxAnalysis espera { reformImpact: ... }
            // Se o dashboard NÃO salva o reformImpact já processado, este hook precisaria processar.
            // Mas o código original assumia que já estava salvo.
            // Vamos assumir que o fluxo deve salvar o reformImpact ou que devemos extrair do analysis.

            // CORREÇÃO: O dashboard salva { analysis: GenerateTaxScenariosOutput, ... }
            // A output do 'generateTaxScenarios' não tem 'reformImpact' direto, tem 'complianceAnalysis'.
            // O 'ImpactReport' é gerado por 'calculateReformImpact'.
            // Se não estiver salvo, precisamos calcular.

            // Mas primeiro, vamos corrigir o storage e key.
            if (data.reformImpact) {
                const report: ImpactReport = {
                    ...data.reformImpact,
                    analysisDate: new Date(data.reformImpact.analysisDate),
                };
                setImpactReport(report);
            } else if (data && typeof data === 'object' && 'analysis' in data) {
                // Fallback: Gerar relatório usando o calculador client-side
                const fallbackData = data as {
                    analysis: GenerateTaxScenariosOutput;
                    clientName?: string;
                    initialParameters?: { regime?: string; cnaes?: string[] };
                };

                const analysis = fallbackData.analysis;
                const clientName = fallbackData.clientName || 'Cliente';
                const initialParams = fallbackData.initialParameters || {};

                // Deduzir regime atual
                const regime = initialParams.regime || 'Simples Nacional';

                // Deduzir setor
                const sector = 'Saúde (Estimado)';

                // Mapear cenários para o formato esperado pelo calculador (TaxScenarioResult vs ScenarioDetail)
                // Usamos unknown para fazer o cast seguro dos tipos incompatíveis
                const mappedScenarios = (analysis.scenarios || []).map((s) => ({
                    ...s,
                    totalTax: s.totalTaxValue || 0,
                    netProfit: s.netProfitDistribution || 0,
                    proLabore: s.proLaboreAnalysis?.baseValue || 0,
                    inssTax: s.proLaboreAnalysis?.inssValue || 0,
                    irpfTax: s.proLaboreAnalysis?.irrfValue || 0,
                    taxBreakdown: s.taxBreakdown || [],
                    isBest: false,
                    isWorst: false
                })) as unknown as TaxScenarioResult[];

                const report = generateImpactReport(mappedScenarios, {
                    companyName: clientName,
                    monthlyRevenue: analysis.monthlyRevenue || 0,
                    regime,
                    sector,
                    cnaes: initialParams.cnaes
                });

                setImpactReport(report);
            } else {
                setImpactReport(null);
            }

            setLoading(false);
        } catch (err) {
            console.error('Erro ao carregar análise de impacto:', err);
            setError('Erro ao carregar dados salvos');
            setLoading(false);
        }
    };

    const clearImpactReport = () => {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
            setImpactReport(null);
        } catch (err) {
            console.error('Erro ao limpar análise:', err);
        }
    };

    const refreshImpactReport = () => {
        loadImpactReport();
    };

    return {
        impactReport,
        loading,
        error,
        clearImpactReport,
        refreshImpactReport,
        hasData: impactReport !== null,
    };
}
