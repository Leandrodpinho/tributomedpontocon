
import { GenerateTaxScenariosOutputSchema } from './src/ai/flows/types';

const mockAiResponse = {
    monthlyRevenue: 50000,
    scenarios: [
        {
            name: "Simples Nacional",
            scenarioRevenue: 50000,
            totalTaxValue: 3000,
            effectiveRate: 6,
            effectiveRateOnProfit: 7.5,
            taxCostPerEmployee: 500,
            taxBreakdown: [
                { name: "DAS", rate: 6, value: 3000 }
            ],
            proLaboreAnalysis: {
                baseValue: 14000,
                inssValue: 1540,
                irrfValue: 2000,
                netValue: 10460
            },
            netProfitDistribution: 35000,
            notes: "Cenário base."
        }
    ],
    executiveSummary: "Recomendado Simples Nacional base.",
    complianceAnalysis: {
        cnaeValidation: ["Adequado"],
        naturezaJuridicaCheck: "OK",
        alerts: []
    }
};

console.log("Simulating AI Response Parsing...");

try {
    const parsed = GenerateTaxScenariosOutputSchema.parse(mockAiResponse);
    console.log("✅ Validation SUCCESS!");
    console.log("Parsed Output:", JSON.stringify(parsed, null, 2));
} catch (error) {
    console.error("❌ Validation FAILED:", error);
    process.exit(1);
}
