import { generateTaxScenarios } from '../generate-tax-scenarios';
import type { GenerateTaxScenariosInput } from '../types';

// Mock do Genkit AI com lógica de cálculo simplificada
jest.mock('@/ai/genkit', () => {
  const originalGenkit = jest.requireActual('genkit');
  return {
    ai: {
      ...originalGenkit.ai,
      definePrompt: jest.fn().mockImplementation(() => {
        return jest.fn().mockImplementation(async (input: GenerateTaxScenariosInput) => {
          // Lógica de cálculo simplificada para simulação
          const revenueText = input.clientData?.match(/R\$\s*([\d.,]+)/);
          const monthlyRevenue = revenueText ? parseFloat(revenueText[1].replace(/\./g, '').replace(',', '.')) : 0;

          const createScenario = (name: string, revenue: number) => {
            // Simples Nacional Anexo III (simulado)
            const snTax = revenue * 0.06; // Alíquota fixa de 6% para o mock
            const proLabore = revenue * 0.28; // Fator R
            const inss = proLabore * 0.11;
            const formattedRevenue = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(revenue);
            return {
              name: `Cenário para ${input.companyName}: ${name} com Faturamento de R$ ${formattedRevenue}`,
              totalTaxValue: snTax,
              effectiveRate: 6.00,
              effectiveRateOnProfit: 10.0,
              taxCostPerEmployee: input.payrollExpenses ? snTax / (input.payrollExpenses / 2000) : 0,
              taxBreakdown: [{ name: 'DAS', rate: 6.00, value: snTax }],
              proLaboreAnalysis: {
                baseValue: proLabore,
                inssValue: inss,
                irrfValue: 0, // Simplificado
                netValue: proLabore - inss,
              },
              netProfitDistribution: revenue - snTax - proLabore,
              notes: 'Cálculo simulado pelo mock de teste.',
            };
          };

          const scenarios = [];
          const revenueLevels = [monthlyRevenue, monthlyRevenue * 1.2, monthlyRevenue * 1.5];
          for (const revenue of revenueLevels) {
            scenarios.push(createScenario('Simples Nacional Anexo III', revenue));
            // Adicionar mocks para outros regimes se necessário
          }
          
          if (input.payrollExpenses && input.payrollExpenses > 0) {
             scenarios.push(createScenario('Simples Nacional Anexo III - Com Folha CLT', monthlyRevenue));
          }


          return {
            output: {
              transcribedText: input.documentsAsText || '',
              monthlyRevenue,
              scenarios,
              executiveSummary: '**Resumo Executivo (Mock)**\n\n- Recomendação: Simples Nacional Anexo III.\n- Projeções: Lucro Presumido pode ser vantajoso acima de R$ 20.000.\n- Pontos de Atenção: Verificar alíquota de ISS.',
            },
          };
        });
      }),
      defineFlow: jest.fn((_config, handler) => {
        return jest.fn(async (input) => {
          return handler(input);
        });
      }),
    },
  };
});

describe('generateTaxScenarios - Simulação de Cálculos com Mock', () => {
  it('deve gerar cenários tributários com base na lógica do mock', async () => {
    const mockInput: GenerateTaxScenariosInput = {
      clientType: 'Novo aberturas de empresa',
      clientData: 'Faturamento mensal: R$ 10.000,00',
      payrollExpenses: 0,
      issRate: 4.0,
      companyName: 'Clínica Teste',
    };

    const result = await generateTaxScenarios(mockInput);

    expect(result).toBeDefined();
    expect(result.monthlyRevenue).toBe(10000);
    expect(result.scenarios.length).toBe(3); // 3 níveis de faturamento

    const snAnexoIIIAtual = result.scenarios[0];
    expect(snAnexoIIIAtual.name).toContain('Simples Nacional Anexo III');
    expect(snAnexoIIIAtual.name).toContain('R$ 10.000,00');
    expect(snAnexoIIIAtual.totalTaxValue).toBeCloseTo(600); // 10000 * 0.06
    expect(snAnexoIIIAtual.proLaboreAnalysis.baseValue).toBeCloseTo(2800); // 10000 * 0.28
    expect(snAnexoIIIAtual.netProfitDistribution).toBeCloseTo(10000 - 600 - 2800); // 6600

    expect(result.executiveSummary).toContain('**Resumo Executivo (Mock)**');
  });
  
  it('deve gerar cenários com folha CLT quando especificado', async () => {
    const mockInput: GenerateTaxScenariosInput = {
      clientType: 'Novo aberturas de empresa',
      clientData: 'Faturamento mensal: R$ 10.000,00',
      payrollExpenses: 2000, // Com folha de pagamento
      issRate: 4.0,
      companyName: 'Clínica com CLT',
    };

    const result = await generateTaxScenarios(mockInput);

    expect(result).toBeDefined();
    expect(result.monthlyRevenue).toBe(10000);
    expect(result.scenarios.length).toBe(4); // 3 níveis de faturamento + 1 com folha
    
    const snAnexoIIIComFolha = result.scenarios.find(s => s.name.includes('Com Folha CLT'));
    expect(snAnexoIIIComFolha).toBeDefined();
    expect(snAnexoIIIComFolha?.taxCostPerEmployee).toBeGreaterThan(0);
  });
});
