
import { generateTaxScenarios } from '../generate-tax-scenarios';
import type { GenerateTaxScenariosInput } from '../types';
import { generateText } from 'ai';

// Mock Vercel AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

jest.mock('@ai-sdk/groq', () => ({
  createGroq: jest.fn(() => jest.fn()),
}));

describe('generateTaxScenarios', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // clears cache
    process.env = { ...OLD_ENV, GROQ_API_KEY: 'test-key' }; // Set dummy key
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old env
  });

  it('deve gerar cenários tributários integrando IA e Engine', async () => {
    // Re-import module to pick up new env var
    const { generateTaxScenarios } = require('../generate-tax-scenarios');
    const { generateText } = require('ai');

    const mockInput: GenerateTaxScenariosInput = {
      clientType: 'Novo aberturas de empresa',
      clientData: 'Faturamento mensal: R$ 10.000,00. Clínica médica.',
      payrollExpenses: 0,
      issRate: 4.0,
      companyName: 'Clínica Teste',
    };

    const mockAIResponse = {
      monthlyRevenue: 10000,
      activities: [
        { name: 'Serviços Médicos', revenue: 10000, type: 'service', simplesAnexo: 'III', isMeiEligible: false }
      ],
      complianceAnalysis: {},
      executiveSummary: 'Resumo mockado'
    };

    (generateText as jest.Mock).mockResolvedValue({
      text: JSON.stringify(mockAIResponse)
    });

    const result = await generateTaxScenarios(mockInput);

    expect(result).toBeDefined();
    expect(result.monthlyRevenue).toBe(10000);

    // The engine should generate scenarios based on the activity
    // Anexo III service -> Simples Nacional Anexo III should be present
    const snAnexoIII = result.scenarios.find((s: any) => s.name.includes('Anexo III'));
    expect(snAnexoIII).toBeDefined();

    // Check specific values calculated by deterministic engine
    // Revenue 10k, Anexo III rate is approx 6%
    if (snAnexoIII) {
      expect(snAnexoIII.totalTaxValue).toBeGreaterThan(0);
      expect(snAnexoIII.proLaboreAnalysis?.baseValue).toBeGreaterThan(0);
    }
  });

  it('deve lidar com falha da IA usando retries ou erro', async () => {
    // Re-import module to pick up new env var
    const { generateTaxScenarios } = require('../generate-tax-scenarios');
    const { generateText } = require('ai');

    (generateText as jest.Mock).mockRejectedValue(new Error('AI Failed'));

    const mockInput: GenerateTaxScenariosInput = {
      clientType: 'Novo aberturas de empresa',
    };

    await expect(generateTaxScenarios(mockInput)).rejects.toThrow();
  });
});
