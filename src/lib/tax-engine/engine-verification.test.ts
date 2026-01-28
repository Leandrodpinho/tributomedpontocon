import { generateDeterministicScenarios } from './engine';
import { GenerateTaxScenariosInput } from '@/ai/flows/types';

describe('Tax Engine Verification - MEI and Mixed Activities', () => {

    // 1. MEI Eligibility Test
    test('Should include MEI for eligible small business', () => {
        const input: GenerateTaxScenariosInput = {
            clientType: 'Novo aberturas de empresa',
            monthlyRevenue: 0,
            rbt12: 5000 * 12, // 60k/year -> Eligible for MEI (Limit 81k)
            activities: [
                {
                    name: 'Comércio de Roupas',
                    revenue: 5000,
                    type: 'commerce',
                    simplesAnexo: 'I',
                    isMeiEligible: true
                }
            ]
        };

        const result = generateDeterministicScenarios(input);
        const meiScenario = result.find(s => s.scenarioType === 'mei');

        expect(meiScenario).toBeDefined();
        expect(meiScenario?.isEligible).toBe(true);
        expect(meiScenario?.totalTaxValue).toBeLessThan(100); // Fixed tax should be low (~70-80)
    });

    // 2. MEI Ineligibility (Revenue)
    test('Should exclude MEI for high revenue', () => {
        const input: GenerateTaxScenariosInput = {
            clientType: 'Novo aberturas de empresa',
            monthlyRevenue: 0,
            rbt12: 100000, // 100k/year -> Ineligible for MEI (>81k)
            activities: [
                {
                    name: 'Comércio de Roupas',
                    revenue: 8500,
                    type: 'commerce',
                    simplesAnexo: 'I',
                    isMeiEligible: true
                }
            ]
        };

        const result = generateDeterministicScenarios(input);
        // Agora retorna MEI mas com isEligible = false
        const meiScenario = result.find(s => s.scenarioType === 'mei');
        expect(meiScenario).toBeDefined();
        expect(meiScenario?.isEligible).toBe(false);
        expect(meiScenario?.eligibilityNote).toContain('Faturamento anual');
    });

    // 3. MEI Ineligibility (Activity)
    test('Should exclude MEI for ineligible activity', () => {
        const input: GenerateTaxScenariosInput = {
            clientType: 'Novo aberturas de empresa',
            monthlyRevenue: 0,
            rbt12: 60000,
            activities: [
                {
                    name: 'Consultoria de TI',
                    revenue: 5000,
                    type: 'service',
                    simplesAnexo: 'V',
                    isMeiEligible: false
                }
            ]
        };

        const result = generateDeterministicScenarios(input);
        const meiScenario = result.find(s => s.scenarioType === 'mei');
        // Agora retorna MEI mas com isEligible = false
        expect(meiScenario).toBeDefined();
        expect(meiScenario?.isEligible).toBe(false);
        expect(meiScenario?.eligibilityNote).toContain('atividades não permitidas');
    });

    // 4. Mixed Activity (Bar + Quadra) - User's Example
    test('Should calculate Mixed Simples correctly for Bar (Anexo I) + Quadra (Anexo III)', () => {
        const input: GenerateTaxScenariosInput = {
            clientType: 'Novo aberturas de empresa',
            monthlyRevenue: 0,
            rbt12: 0, // New company
            activities: [
                {
                    name: 'Bar',
                    revenue: 5000,
                    type: 'commerce',
                    simplesAnexo: 'I',
                    isMeiEligible: true
                },
                {
                    name: 'Aluguel de Quadra',
                    revenue: 5000,
                    type: 'service',
                    simplesAnexo: 'III',
                    isMeiEligible: true
                }
            ]
        };
        // Total Revenue = 10,000
        // Annual Projection = 120,000

        const result = generateDeterministicScenarios(input);

        // Agora retorna sempre
        const meiScenario = result.find(s => s.scenarioType === 'mei');

        expect(meiScenario).toBeDefined();
        expect(meiScenario?.isEligible).toBe(false);

        // Check Simples Misto
        const simplesScenario = result.find(s => s.scenarioType === 'simples_misto');
        expect(simplesScenario).toBeDefined();
        expect(simplesScenario?.taxBreakdown).toBeDefined();

        // Should have breakdown for Anexo I and III
        const anexoI = simplesScenario?.taxBreakdown?.find(t => t.name.includes('Anexo I'));
        const anexoIII = simplesScenario?.taxBreakdown?.find(t => t.name.includes('Anexo III'));

        expect(anexoI).toBeDefined();
        expect(anexoIII).toBeDefined();

        // Anexo I (Commerce) rate for 120k is 4%
        // Tax = 5000 * 0.04 = 200
        expect(anexoI?.value).toBeCloseTo(200, 0);

        // Anexo III (Service) rate for 120k is 6%
        // Tax = 5000 * 0.06 = 300
        expect(anexoIII?.value).toBeCloseTo(300, 0);
    });

    // 5. Presumed Profit Mixed
    test('Should calculate mixed Presumed Profit bases', () => {
        const input: GenerateTaxScenariosInput = {
            clientType: 'Novo aberturas de empresa',
            monthlyRevenue: 0,
            // RBT12 doesn't matter much for Presumed rates (fixed except for additional IRPJ)
            activities: [
                { name: 'Comércio', revenue: 10000, type: 'commerce', simplesAnexo: 'I', isMeiEligible: true }, // Base 8%
                { name: 'Serviço', revenue: 10000, type: 'service', simplesAnexo: 'III', isMeiEligible: true } // Base 32%
            ]
        };

        const result = generateDeterministicScenarios(input);
        const lpScenario = result.find(s => s.name === 'Lucro Presumido (Misto)');

        expect(lpScenario).toBeDefined();

        // Verification of IRPJ Base:
        // Commerce: 10000 * 0.08 = 800
        // Service: 10000 * 0.32 = 3200
        // Total Base = 4000
        // IRPJ (15%) = 600
        const irpj = lpScenario?.taxBreakdown?.find(t => t.name.includes('IRPJ'));
        expect(irpj?.value).toBeCloseTo(600 + (4000 * 0.09 /*CSLL included in breakdown often combined or check logic*/), -3);
        // In my code: { name: 'IRPJ/CSLL', value: irpj + csll }

        // CSLL Base:
        // Commerce: 10000 * 0.12 = 1200
        // Service: 10000 * 0.32 = 3200
        // Total Base = 4400
        // CSLL (9%) = 396

        // Total IRPJ+CSLL = 600 + 396 = 996
        const irpjCsll = lpScenario?.taxBreakdown?.find(t => t.name.includes('IRPJ/CSLL'));
        expect(irpjCsll?.value).toBeCloseTo(996, 0);
    });
});
