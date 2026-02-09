
import { generateDeterministicScenarios } from './src/lib/tax-engine/engine';
import { GenerateTaxScenariosInput } from './src/ai/flows/types';

const baseInput: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    monthlyRevenue: 50000,
    activities: [{
        name: 'Serviços Médicos',
        revenue: 50000,
        type: 'service',
        simplesAnexo: 'V',
        isMeiEligible: false
    }],
    issRate: 5,
    numberOfPartners: 1,
    payrollExpenses: 0
};

console.log('--- Simulating WITHOUT Equiparação Hospitalar ---');
const inputNormal = { ...baseInput, isHospitalEquivalent: false };
const scenariosNormal = generateDeterministicScenarios(inputNormal);
const lpNormal = scenariosNormal.find(s => s.scenarioType === 'presumido');
const rateNormal = lpNormal?.effectiveRate ?? 0;
console.log(`Lucro Presumido (Normal) Effective Rate: ${rateNormal.toFixed(2)}%`);

console.log('\n--- Simulating WITH Equiparação Hospitalar ---');
const inputHospital = { ...baseInput, isHospitalEquivalent: true };
const scenariosHospital = generateDeterministicScenarios(inputHospital);
const lpHospital = scenariosHospital.find(s => s.scenarioType === 'presumido');
const rateHospital = lpHospital?.effectiveRate ?? 0;
console.log(`Lucro Presumido (Hospital) Effective Rate: ${rateHospital.toFixed(2)}%`);

if (rateNormal === rateHospital && rateNormal !== 0) {
    console.log('\n[FAIL] Bug reproduced: Effective rates are identical.');
    process.exit(1);
} else if (rateNormal === 0) {
    console.log('\n[ERROR] Calculation returned 0. Check logic.');
    process.exit(1);
} else {
    console.log('\n[SUCCESS] Effective rates are different. Fix verified.');
    process.exit(0);
}
