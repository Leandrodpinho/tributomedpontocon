import { calculateIRPFImpact, CalculateIRPFImpactInput, CalculateIRPFImpactOutput } from '../calculate-irpf-impact';
import { ai } from '@/ai/genkit';

// Mock do Genkit AI
jest.mock('@/ai/genkit', () => {
  const originalGenkit = jest.requireActual('genkit');
  return {
    ai: {
      ...originalGenkit.ai,
      definePrompt: jest.fn(() => {
        return jest.fn(async (input) => {
          // Simula a saída do prompt com base na entrada
          const taxableIncome = input.proLabore - input.inssContribution;
          let taxBracket = 'Isento';
          let irpfDue = 0;
          let netImpact = taxableIncome;

          // Tabela progressiva do IRPF (simplificada para o mock)
          if (taxableIncome > 1903.98 && taxableIncome <= 2826.65) {
            taxBracket = '7,5%';
            irpfDue = taxableIncome * 0.075 - 142.80;
          } else if (taxableIncome > 2826.65 && taxableIncome <= 3751.05) {
            taxBracket = '15%';
            irpfDue = taxableIncome * 0.15 - 354.80;
          } else if (taxableIncome > 3751.05 && taxableIncome <= 4664.68) {
            taxBracket = '22,5%';
            irpfDue = taxableIncome * 0.225 - 636.13;
          } else if (taxableIncome > 4664.68) {
            taxBracket = '27,5%';
            irpfDue = taxableIncome * 0.275 - 869.36;
          }
          netImpact = taxableIncome - irpfDue;

          return {
            output: {
              impactDetails: {
                taxableIncome: parseFloat(taxableIncome.toFixed(2)),
                taxBracket: taxBracket,
                irpfDue: parseFloat(irpfDue.toFixed(2)),
                deductions: input.inssContribution,
                netImpact: parseFloat(netImpact.toFixed(2)),
                summary: `Simulação de IRPF para o regime ${input.taxRegime}.`,
              },
            } as CalculateIRPFImpactOutput,
          };
        });
      }),
      defineFlow: jest.fn((_, handler) => {
        return jest.fn(async (input) => {
          return handler(input);
        });
      }),
    },
  };
});

describe('calculateIRPFImpact', () => {
  it('deve calcular o impacto do IRPF para Simples Nacional Anexo III', async () => {
    const mockInput: CalculateIRPFImpactInput = {
      taxRegime: 'Simples Nacional Anexo III',
      proLabore: 5000,
      profitDistribution: 10000,
      inssContribution: 550,
      clientRevenue: 15000,
      payrollExpenses: 0,
    };

    // Recalculando os valores esperados com base na lógica do mock
    const taxableIncome = mockInput.proLabore - mockInput.inssContribution;
    let irpfDue = 0;
    if (taxableIncome > 3751.05 && taxableIncome <= 4664.68) { // Faixa de 22,5%
      irpfDue = parseFloat((taxableIncome * 0.225 - 636.13).toFixed(2));
    }
    const netImpact = parseFloat((taxableIncome - irpfDue).toFixed(2));

    const expectedOutput: CalculateIRPFImpactOutput = {
      impactDetails: {
        taxableIncome,
        taxBracket: '22,5%', // Corrigido para a faixa correta
        irpfDue,
        deductions: 550,
        netImpact,
        summary: `Simulação de IRPF para o regime ${mockInput.taxRegime}.`,
      },
    };

    const result = await calculateIRPFImpact(mockInput);

    expect(result).toEqual(expectedOutput);
    expect(ai.definePrompt).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'calculateIRPFImpactPrompt' })
    );
    expect(ai.defineFlow).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'calculateIRPFImpactFlow' }),
      expect.any(Function)
    );
  });

  it('deve calcular o impacto do IRPF para Lucro Presumido com pró-labore menor', async () => {
    const mockInput: CalculateIRPFImpactInput = {
      taxRegime: 'Lucro Presumido',
      proLabore: 2000, // Pró-labore menor
      profitDistribution: 13000,
      inssContribution: 220, // 11% de 2000
      clientRevenue: 15000,
      payrollExpenses: 0,
    };

    const taxableIncome = mockInput.proLabore - mockInput.inssContribution;
    const irpfDue = 0;
    const netImpact = taxableIncome;

    const expectedOutput: CalculateIRPFImpactOutput = {
      impactDetails: {
        taxableIncome,
        taxBracket: 'Isento',
        irpfDue,
        deductions: 220,
        netImpact,
        summary: `Simulação de IRPF para o regime ${mockInput.taxRegime}.`,
      },
    };

    const result = await calculateIRPFImpact(mockInput);

    expect(result).toEqual(expectedOutput);
  });
});
