
import { generateDeterministicScenarios } from './src/lib/tax-engine/engine';
import { GenerateTaxScenariosInput } from './src/ai/flows/types';

// Scenario 1: Bar + Quadra (Expected: Eligible)
const inputEligible: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 6000,
    rbt12: 72000,
    activities: [
        { name: 'Bar', revenue: 3000, type: 'commerce', simplesAnexo: 'I', isMeiEligible: true },
        { name: 'Quadra', revenue: 3000, type: 'service', simplesAnexo: 'III', isMeiEligible: true }
    ]
};

// Scenario 2: Bar + Quadra + Professor (Expected: Ineligible)
const inputIneligible: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 6000,
    rbt12: 72000,
    activities: [
        { name: 'Bar', revenue: 2000, type: 'commerce', simplesAnexo: 'I', isMeiEligible: true },
        { name: 'Quadra', revenue: 2000, type: 'service', simplesAnexo: 'III', isMeiEligible: true },
        { name: 'Professor', revenue: 2000, type: 'service', simplesAnexo: 'III', isMeiEligible: false } // Professor not allowed in MEI
    ]
};

console.log("--- TEST 1: Bar + Quadra (Should be MEI Eligible) ---");
const results1 = generateDeterministicScenarios(inputEligible);
const mei1 = results1.find(s => s.scenarioType === 'mei');
console.log(mei1 ? `MEI FOUND: Eligible=${mei1.isEligible}` : "MEI NOT FOUND");
if (mei1) console.log(`Note: ${mei1.eligibilityNote}`);

console.log("\n--- TEST 2: Bar + Quadra + Professor (Should be MEI Ineligible) ---");
const results2 = generateDeterministicScenarios(inputIneligible);
// Check names
console.log("\n--- Scenario Names Generated ---");
results2.forEach(s => console.log(`- ${s.name}`));

const mei2 = results2.find(s => s.scenarioType === 'mei');
console.log(mei2 ? `\nMEI FOUND: Eligible=${mei2.isEligible}` : "\nMEI NOT FOUND (Correct if ineligible)");

// SIMULATE FRONTEND SELECTION LOGIC
const bestScenario = results2.reduce((acc, scenario) => {
    // IGNORA cenários marcados explicitamente como INELEGÍVEIS
    if (scenario.isEligible === false) return acc;

    if (!acc) return scenario;
    return (scenario.totalTaxValue ?? 0) < (acc.totalTaxValue ?? 0) ? scenario : acc;
}, undefined as any);

console.log(`\nBEST SCENARIO SELECTED: ${bestScenario?.name}`);
console.log(`Expected: NOT MEI. Actual: ${bestScenario?.name}`);

if (bestScenario?.scenarioType === 'mei') {
    console.error("FAIL: MEI selected despite being ineligible!");
} else {
    console.log("PASS: Ineligible MEI was skipped.");
}

// --- TEST 3: SIMULATOR LOGIC (calculateAllScenarios) ---
console.log("\n--- TEST 3: SIMULATOR LOGIC (calculateAllScenarios) ---");
import { calculateAllScenarios } from './src/lib/tax-calculator';

// Simulate high revenue (54k/month) -> MEI Ineligible due to revenue
const simResults = calculateAllScenarios({
    monthlyRevenue: 54000,
    payrollExpenses: 5000,
    issRate: 5,
    activities: [
        { name: 'Serviços', revenue: 54000, type: 'service', simplesAnexo: 'III', isMeiEligible: true } // Eligible activity, but revenue too high
    ]
});

// Check if MEI exists
const simMei = simResults.find(s => s.name.includes('MEI'));
console.log(`MEI EXISTS in list: ${!!simMei}`);
if (simMei) console.log(`MEI Is Eligible: ${simMei.isEligible}`);

// Check Best Scenario
const simBest = simResults.find(s => s.isBest);
console.log(`BEST SCENARIO: ${simBest?.name}`);
console.log(`Expected: NOT MEI. Actual: ${simBest?.name}`);

if (simBest?.name.includes('MEI')) {
    console.error("FAIL: Simulator selected MEI as best despite 54k revenue!");
} else {
    console.log("PASS: Simulator correctly skipped MEI.");
}

// --- TEST 4: NAMING LOGIC (Misto vs Simple) ---
console.log("\n--- TEST 4: NAMING LOGIC (Misto vs Simple) ---");
// Case A: Multiple Activities of SAME Type (Should NOT be Misto)
const resultsSameType = generateDeterministicScenarios({
    ...inputIneligible,
    activities: [
        { name: 'Consulta Médica', revenue: 20000, type: 'service', simplesAnexo: 'III', isMeiEligible: false },
        { name: 'Procedimento', revenue: 10000, type: 'service', simplesAnexo: 'III', isMeiEligible: false }
    ]
});
const lpSame = resultsSameType.find(s => s.scenarioType === 'presumido');
const simplesSame = resultsSameType.find(s => s.scenarioType === 'simples_anexo_iii');

console.log(`Same Type LP Name: ${lpSame?.name}`);
console.log(`Same Type Simples Name: ${simplesSame?.name}`);

if (lpSame?.name.includes('Misto')) console.error("FAIL: LP marked as Misto despite same type!");
else console.log("PASS: LP correctly simple.");

if (simplesSame?.name.includes('Misto')) console.error("FAIL: Simples marked as Misto despite same Anexo!");
else console.log("PASS: Simples correctly simple.");

// Case B: Mixed Types (Should BE Misto)
const resultsMixedType = generateDeterministicScenarios({
    ...inputIneligible,
    activities: [
        { name: 'Venda de Produtos', revenue: 20000, type: 'commerce', simplesAnexo: 'I', isMeiEligible: false },
        { name: 'Procedimento', revenue: 10000, type: 'service', simplesAnexo: 'III', isMeiEligible: false }
    ]
});
const lpMixed = resultsMixedType.find(s => s.scenarioType === 'presumido');
const simplesMixed = resultsMixedType.find(s => s.scenarioType === 'simples_misto');

console.log(`Mixed Type LP Name: ${lpMixed?.name}`);
console.log(`Mixed Type Simples Name: ${simplesMixed?.name}`);

if (!lpMixed?.name.includes('Misto')) console.error("FAIL: LP NOT marked as Misto despite mixed types!");
else console.log("PASS: LP correctly Misto.");

if (!simplesMixed?.name.includes('Misto')) console.error("FAIL: Simples NOT marked as Misto despite mixed Anexos!");
else console.log("PASS: Simples correctly Misto.");
