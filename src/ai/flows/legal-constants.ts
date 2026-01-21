/**
 * @fileOverview Centralizes legal and financial constants that change over time.
 * This allows for easy annual updates without modifying the core logic.
 *
 * Valores vigentes para o Ano-Calendário 2025.
 */

export const LEGAL_CONSTANTS_2025 = {
  // --- Parâmetros Gerais ---
  minimumWage: 1620.99,
  inssCeiling: 8157.41,

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

  // --- INSS Progressivo (Estimativa 2026) ---
  inssTable: [
    { limit: 1620.99, rate: 0.075, deduction: 0.00 },
    { limit: 2793.88, rate: 0.09, deduction: 24.31 }, // Ajustado para base 1620.99
    { limit: 4190.83, rate: 0.12, deduction: 106.59 },
    { limit: 8157.41, rate: 0.14, deduction: 190.40 },
  ],

  // --- Simples Nacional: Anexo III (Serviços em Geral) ---
  simplesAnexoIII: [
    { limit: 180000.00, rate: 0.06, deduction: 0.00 },
    { limit: 360000.00, rate: 0.112, deduction: 9360.00 },
    { limit: 720000.00, rate: 0.135, deduction: 17640.00 },
    { limit: 1800000.00, rate: 0.16, deduction: 35640.00 },
    { limit: 3600000.00, rate: 0.21, deduction: 125640.00 },
    { limit: 4800000.00, rate: 0.33, deduction: 648000.00 }, // Faixa sublimite varia por estado, assumindo teto federal
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