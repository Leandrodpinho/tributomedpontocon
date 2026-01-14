/**
 * Hook React para gerenciar Análise de Impactos da Reforma Tributária
 */

'use client';

import { useState, useEffect } from 'react';
import type { ImpactReport, SavedTaxAnalysis } from '@/types/reform-impact';

const STORAGE_KEY = 'lastTaxAnalysis';

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

            // Carregar do localStorage
            const stored = localStorage.getItem(STORAGE_KEY);

            if (!stored) {
                setImpactReport(null);
                setLoading(false);
                return;
            }

            const data: SavedTaxAnalysis = JSON.parse(stored);

            // Verificar se tem relatório de impacto
            if (data.reformImpact) {
                // Converter strings de data para objetos Date
                const report: ImpactReport = {
                    ...data.reformImpact,
                    analysisDate: new Date(data.reformImpact.analysisDate),
                };

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
            localStorage.removeItem(STORAGE_KEY);
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
