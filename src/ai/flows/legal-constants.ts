/**
 * @fileOverview Centralizes legal and financial constants that change over time.
 * This allows for easy annual updates without modifying the core logic of the AI prompts.
 */

export const LEGAL_CONSTANTS_2025 = {
  minimumWage: 1518.0,
  inssCeiling: 8157.41,
  // Adicione outras tabelas e valores aqui conforme necessário (ex: faixas do IRPF)
};

export type LegalConstants = typeof LEGAL_CONSTANTS_2025;