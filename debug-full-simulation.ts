
import { generateDeterministicScenarios } from './src/lib/tax-engine/engine';
import { calculateAllScenarios } from './src/lib/tax-calculator';
import { GenerateTaxScenariosInput, ScenarioDetail } from './src/ai/flows/types';

// Helper to print results
function printScenarios(title: string, scenarios: ScenarioDetail[]) {
    console.log(`\n\n=== ${title} ===`);

    // Find Best
    const best = scenarios.reduce((prev, current) => {
        if (current.isEligible === false) return prev;
        if (!prev) return current;
        if (prev.isEligible === false) return current;
        return (prev.totalTaxValue || 0) < (current.totalTaxValue || 0) ? prev : current;
    }, undefined as ScenarioDetail | undefined);

    console.log(`🏆 BEST SCENARIO: ${best?.name || 'None'}`);
    console.log(`💰 Revenue Treated: ${scenarios[0]?.scenarioRevenue}`);

    scenarios.forEach(s => {
        const flag = s.name === best?.name ? '✅ ' : '   ';
        const eligibility = s.isEligible === false ? '❌ INELEGÍVEL' : 'OK';
        console.log(`${flag}${s.name.padEnd(40)} | R$ ${(s.totalTaxValue || 0).toFixed(2).padStart(10)} | Eff: ${(s.effectiveRate || 0).toFixed(2)}% | ${eligibility}`);
        if (s.isEligible === false) console.log(`      -> Reason: ${s.eligibilityNote}`);
        // Check for Misto naming
        if (s.name.includes('Misto')) console.log(`      -> Note: Mixed Regime Detected`);
    });
}

// ==========================================
// TEST 1: MEI ELIGIBLE (Low Revenue, Allowed Activity)
// ==========================================
const inputMeiEligible: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 5000,
    activities: [
        { name: 'Comércio de Roupas', revenue: 5000, type: 'commerce', simplesAnexo: 'I', isMeiEligible: true }
    ]
};
printScenarios("TEST 1: MEI ELIGIBLE (5k/mo Commerce)", generateDeterministicScenarios(inputMeiEligible));


// ==========================================
// TEST 2: MEI INELIGIBLE (Revenue Too High)
// ==========================================
const inputMeiRevenueHigh: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 7000, // 84k annual > 81k limit
    activities: [
        { name: 'Comércio de Roupas', revenue: 7000, type: 'commerce', simplesAnexo: 'I', isMeiEligible: true }
    ]
};
printScenarios("TEST 2: MEI HIGH REVENUE (7k/mo -> 84k/yr)", generateDeterministicScenarios(inputMeiRevenueHigh));


// ==========================================
// TEST 3: MEI INELIGIBLE (Activity Not Allowed)
// ==========================================
const inputMeiActivity: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 5000,
    activities: [
        { name: 'Consultoria TI', revenue: 5000, type: 'service', simplesAnexo: 'V', isMeiEligible: false }
    ]
};
printScenarios("TEST 3: MEI FORBIDDEN ACTIVITY (Consultoria)", generateDeterministicScenarios(inputMeiActivity));


// ==========================================
// TEST 4: MIXED ACTIVITIES (Simples Misto & Presumido Misto)
// ==========================================
// Commerce (Anexo I) + Service (Anexo III)
const inputMixed: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 30000,
    activities: [
        { name: 'Venda de Produtos', revenue: 20000, type: 'commerce', simplesAnexo: 'I', isMeiEligible: true },
        { name: 'Instalação', revenue: 10000, type: 'service', simplesAnexo: 'III', isMeiEligible: true }
    ]
};
printScenarios("TEST 4: MIXED ACTIVITIES (Commerce + Service)", generateDeterministicScenarios(inputMixed));


// ==========================================
// TEST 5: SAME TYPE MULTIPLE ACTIVITIES (Should NOT be Misto)
// ==========================================
const inputSameType: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 30000,
    activities: [
        { name: 'Consulta', revenue: 20000, type: 'service', simplesAnexo: 'III', isMeiEligible: false },
        { name: 'Procedimento', revenue: 10000, type: 'service', simplesAnexo: 'III', isMeiEligible: false }
    ]
};
printScenarios("TEST 5: SAME TYPE ACTIVITIES (2x Service III)", generateDeterministicScenarios(inputSameType));


// ==========================================
// TEST 6: HIGH REVENUE (Lucro Real Effectiveness)
// ==========================================
const inputHighRevenue: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 500000, // 6M/year
    payrollExpenses: 200000, // High payroll
    activities: [
        { name: 'Hospitalar', revenue: 500000, type: 'service', simplesAnexo: 'III', isMeiEligible: false }
    ],
    realProfitMargin: 10, // Low margin situation -> Real might be better
    isHospitalEquivalent: true // Forced hospitalar presumption
};
printScenarios("TEST 6: HIGH REVENUE (Hospitalar + Low Margin)", generateDeterministicScenarios(inputHighRevenue));


// ==========================================
// TEST 7: SIMULATOR LOGIC (Frontend Adapter Verification)
// ==========================================
console.log("\n\n=== TEST 7: SIMULATOR ADAPTER LOGIC ===");
const simResults = calculateAllScenarios({
    monthlyRevenue: 54000,
    payrollExpenses: 5000,
    issRate: 5,
    activities: [
        { name: 'Serviços', revenue: 54000, type: 'service', simplesAnexo: 'III', isMeiEligible: true }
    ]
});

const simBest = simResults.find(s => s.isBest);
console.log(`Simulator Input: 54k Revenue`);
console.log(`Best Scenario Flagged: ${simBest?.name}`);
console.log(`Is MEI Selected? ${simBest?.name.includes('MEI')}`);

if (simBest?.name.includes('MEI')) {
    console.error("❌ FAILURE: Simulator selected MEI for 54k!");
} else {
    console.log("✅ SUCCESS: Simulator correctly ignored MEI.");
}
