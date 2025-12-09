'use client';

import { DashboardResults } from '@/components/dashboard-results';
import { GenerateTaxScenariosOutput } from '@/ai/flows/types';

const MOCK_ANALYSIS: GenerateTaxScenariosOutput = {
    monthlyRevenue: 50000,
    executiveSummary: "### Resumo Executivo\n\nNeste cenário de faturamento mensal de **R$ 50.000,00**, a estratégia recomendada é o **Lucro Presumido com Equiparação Hospitalar**.\n\n*   **Economia anual estimada:** R$ 35.400,00\n*   **Vantagem competitiva:** Sua alíquota cairia de 16.33% (Média) para ~9.5%.\n",
    transcribedText: "Dados simulados para visualização de demonstração.",
    scenarios: [
        {
            name: "Simples Nacional Anexo V",
            scenarioRevenue: 50000,
            totalTaxValue: 7750, // ~15.5%
            effectiveRate: 15.5,
            netProfitDistribution: 42250,
            taxBreakdown: [
                { name: "DAS", rate: 15.5, value: 7750 }
            ],
            proLaboreAnalysis: {
                baseValue: 14000, // 28%
                inssValue: 1500,
                irrfValue: 2500,
                netValue: 10000
            },
            notes: "Cenário padrão sem planejamento avançado."
        },
        {
            name: "Lucro Presumido + Equiparação (Recomendado)",
            scenarioRevenue: 50000,
            totalTaxValue: 4750, // ~9.5%
            effectiveRate: 9.5,
            netProfitDistribution: 45250,
            taxBreakdown: [
                { name: "IRPJ/CSLL (Reduzido)", rate: 5.2, value: 2600 },
                { name: "PIS/COFINS", rate: 3.65, value: 1825 },
                { name: "ISS (Fixo)", rate: 0, value: 325 }
            ],
            proLaboreAnalysis: {
                baseValue: 1412, // Salário Mínimo
                inssValue: 155,
                irrfValue: 0,
                netValue: 1257
            },
            notes: "Aplicação de teses de equiparação hospitalar para redução drástica da base de cálculo."
        }
    ]
};

export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-background">
            <DashboardResults
                analysis={MOCK_ANALYSIS}
                clientName="Clínica Exemplo (Demo)"
                consultingFirm="Consultoria Demo"
                irpfImpacts={null}
                webhookResponse={null}
            />
        </main>
    );
}
