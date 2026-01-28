/**
 * @fileOverview Centralizes legal and financial constants that change over time.
 * This allows for easy annual updates without modifying the core logic.
 *
 * Valores vigentes para o Ano-Calendário 2025.
 */

export const LEGAL_CONSTANTS_2025 = {
  // --- Parâmetros Gerais 2026 ---
  minimumWage: 1621.00,
  inssCeiling: 8475.55,

  // --- IRPF Progressivo Mensal (2025/2026) ---
  irpfTable: [
    { limit: 2259.20, rate: 0.00, deduction: 0.00 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
  ],
  standardDeductionPerDependent: 189.59,
  simplifiedDeduction: 564.80, // Desconto simplificado mensal

  // --- INSS Progressivo 2026 ---
  inssTable: [
    { limit: 1621.00, rate: 0.075, deduction: 0.00 },
    { limit: 2902.84, rate: 0.09, deduction: 24.32 },
    { limit: 4354.27, rate: 0.12, deduction: 111.40 },
    { limit: 8475.55, rate: 0.14, deduction: 198.49 },
  ],

  // --- Simples Nacional: Anexo I (Comércio) ---
  simplesAnexoI: [
    { limit: 180000.00, rate: 0.04, deduction: 0.00 },
    { limit: 360000.00, rate: 0.073, deduction: 5940.00 },
    { limit: 720000.00, rate: 0.095, deduction: 13860.00 },
    { limit: 1800000.00, rate: 0.107, deduction: 22500.00 },
    { limit: 3600000.00, rate: 0.143, deduction: 87300.00 },
    { limit: 4800000.00, rate: 0.19, deduction: 378000.00 },
  ],

  // --- Simples Nacional: Anexo II (Indústria) ---
  simplesAnexoII: [
    { limit: 180000.00, rate: 0.045, deduction: 0.00 },
    { limit: 360000.00, rate: 0.078, deduction: 5940.00 },
    { limit: 720000.00, rate: 0.10, deduction: 13860.00 },
    { limit: 1800000.00, rate: 0.112, deduction: 22500.00 },
    { limit: 3600000.00, rate: 0.147, deduction: 85500.00 },
    { limit: 4800000.00, rate: 0.30, deduction: 720000.00 },
  ],

  // --- Simples Nacional: Anexo III (Serviços em Geral) ---
  simplesAnexoIII: [
    { limit: 180000.00, rate: 0.06, deduction: 0.00 },
    { limit: 360000.00, rate: 0.112, deduction: 9360.00 },
    { limit: 720000.00, rate: 0.135, deduction: 17640.00 },
    { limit: 1800000.00, rate: 0.16, deduction: 35640.00 },
    { limit: 3600000.00, rate: 0.21, deduction: 125640.00 },
    { limit: 4800000.00, rate: 0.33, deduction: 648000.00 },
  ],

  // --- Simples Nacional: Anexo IV (Serviços - Adv, Limpeza, Obras) ---
  // Nota: INSS Patronal é pago à parte no Anexo IV
  simplesAnexoIV: [
    { limit: 180000.00, rate: 0.045, deduction: 0.00 },
    { limit: 360000.00, rate: 0.09, deduction: 8100.00 },
    { limit: 720000.00, rate: 0.102, deduction: 12420.00 },
    { limit: 1800000.00, rate: 0.14, deduction: 39780.00 },
    { limit: 3600000.00, rate: 0.22, deduction: 183780.00 },
    { limit: 4800000.00, rate: 0.33, deduction: 828000.00 },
  ],

  // --- Simples Nacional: Anexo V (Fator R < 28%) ---
  simplesAnexoV: [
    { limit: 180000.00, rate: 0.155, deduction: 0.00 },
    { limit: 360000.00, rate: 0.18, deduction: 4500.00 },
    { limit: 720000.00, rate: 0.195, deduction: 9900.00 },
    { limit: 1800000.00, rate: 0.205, deduction: 17100.00 },
    { limit: 3600000.00, rate: 0.23, deduction: 62100.00 },
    { limit: 4800000.00, rate: 0.305, deduction: 540000.00 },
  ],

  // --- MEI 2025 ---
  mei: {
    annualLimit: 81000.00,
    monthlyLimit: 6750.00, // Média para referência
    inss: 1621.00 * 0.05, // 5% do Salário Mínimo
    icms: 1.00, // Comércio/Indústria
    iss: 5.00, // Serviços
  },

  // --- Lucro Presumido (Serviços Hospitalares) ---
  presumidoHospitalar: {
    irpjBase: 0.08,
    csllBase: 0.12,
    irpjRate: 0.15,
    csllRate: 0.09,
    pisRate: 0.0065,
    cofinsRate: 0.03,
    additionalIrpjThreshold: 20000.00, // Mensal
    additionalIrpjRate: 0.10,
  },

  // --- Lucro Presumido (Serviços Gerais) ---
  presumidoGeral: {
    irpjBase: 0.32,
    csllBase: 0.32,
    irpjRate: 0.15,
    csllRate: 0.09,
    pisRate: 0.0065,
    cofinsRate: 0.03,
    additionalIrpjThreshold: 20000.00,
    additionalIrpjRate: 0.10,
  },

  // --- Lucro Presumido (Comércio/Indústria) ---
  presumidoComercio: {
    irpjBase: 0.08,
    csllBase: 0.12,
    irpjRate: 0.15,
    csllRate: 0.09,
    pisRate: 0.0065,
    cofinsRate: 0.03,
    additionalIrpjThreshold: 20000.00,
    additionalIrpjRate: 0.10,
  },

  // --- Lucro Real (Estimativa Simplificada para Serviços) ---
  realServicos: {
    pisRate: 0.0165,
    cofinsRate: 0.076,
    irpjRate: 0.15,
    csllRate: 0.09,
    additionalIrpjRate: 0.10,
  }
};

export type LegalConstants = typeof LEGAL_CONSTANTS_2025;