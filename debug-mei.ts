
import { generateDeterministicScenarios } from './src/lib/tax-engine/engine';
import { GenerateTaxScenariosInput } from './src/ai/flows/types';

const input: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 5000,
    rbt12: 60000,
    activities: [] // Should default to generic service eligible for MEI
};

console.log("Running engine with input:", JSON.stringify(input, null, 2));

const results = generateDeterministicScenarios(input);

console.log("Scenarios generated:", results.length);
results.forEach(s => {
    console.log(`- [${s.scenarioType}] ${s.name}: R$ ${s.totalTaxValue?.toFixed(2)} (Eligible: ${s.isEligible})`);
});
