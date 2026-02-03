
import { calculateIRPFImpact, CalculateIRPFImpactInput, CalculateIRPFImpactOutput } from '../calculate-irpf-impact';

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

    const result = await calculateIRPFImpact(mockInput);

    // Manual calculation checks
    const taxableIncome = 5000 - 550; // 4450
    // Bracket logic from source:
    const expectedIR = 338.48;

    expect(result.impactDetails.taxableIncome).toBe(taxableIncome);
    expect(result.impactDetails.irpfDue).toBeCloseTo(expectedIR, 1);
    expect(result.impactDetails.taxBracket).toBe('22,5%');
    expect(result.impactDetails.deductions).toBe(550);
  });

  it('deve calcular o impacto do IRPF para Lucro Presumido com pró-labore menor', async () => {
    const mockInput: CalculateIRPFImpactInput = {
      taxRegime: 'Lucro Presumido',
      proLabore: 2000,
      profitDistribution: 13000,
      inssContribution: 220,
      clientRevenue: 15000,
      payrollExpenses: 0,
    };

    const result = await calculateIRPFImpact(mockInput);

    const taxableIncome = 2000 - 220; // 1780
    // Bracket: <= 1903.98 (Isento -> wait, table 2026 might be different in code)
    // Code imports LEGAL_CONSTANTS_2025.
    // If < bound, rate is 0.

    expect(result.impactDetails.taxableIncome).toBe(taxableIncome);
    // Assuming 1780 is exempt
    expect(result.impactDetails.irpfDue).toBe(0);
    expect(result.impactDetails.netImpact).toBe(0);
  });
});
