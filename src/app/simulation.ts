// Este arquivo serve para simular a execução dos fluxos de IA.
// Não é parte da aplicação final, mas uma ferramenta de desenvolvimento.

import {
  generateTaxScenarios,
  GenerateTaxScenariosInput,
} from '../ai/flows/generate-tax-scenarios.ts';
import {
  calculateIRPFImpact,
  CalculateIRPFImpactInput,
} from '../ai/flows/calculate-irpf-impact.ts';
import {
  extractTextFromImage,
  ExtractTextFromImageInput,
} from '../ai/flows/extract-text-from-image.ts';
import { PlaceHolderImages } from '@/lib/placeholder-images';

async function runSimulation() {
  console.log('Iniciando simulação...');

  // 1. Simulação do fluxo generateTaxScenarios
  console.log('\n--- Simulando generateTaxScenarios ---');
  const taxScenariosInput: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    clientData:
      'Faturamento mensal estimado de R$ 25.000,00. Atividade de clínica médica, sem funcionários no momento.',
    payrollExpenses: 0,
    issRate: 4.0,
    companyName: 'Clínica Saúde Plena',
  };

  try {
    const taxResult = await generateTaxScenarios(taxScenariosInput);
    console.log('generateTaxScenarios concluído com sucesso! Resultado:');
    console.log(JSON.stringify(taxResult, null, 2));
  } catch (error) {
    console.error('Erro em generateTaxScenarios:', error);
  }

  // 2. Simulação do fluxo calculateIRPFImpact
  console.log('\n--- Simulando calculateIRPFImpact ---');
  const irpfImpactInput: CalculateIRPFImpactInput = {
    taxRegime: 'Simples Nacional Anexo V',
    proLabore: 5000,
    profitDistribution: 15000,
    inssContribution: 550,
    clientRevenue: 25000,
    payrollExpenses: 0,
  };

  try {
    const irpfResult = await calculateIRPFImpact(irpfImpactInput);
    console.log('calculateIRPFImpact concluído com sucesso! Resultado:');
    console.log(JSON.stringify(irpfResult, null, 2));
  } catch (error) {
    console.error('Erro em calculateIRPFImpact:', error);
  }

  // 3. Simulação do fluxo extractTextFromImage
  console.log('\n--- Simulando extractTextFromImage ---');
  const textExtractionInput: ExtractTextFromImageInput = {
    document: PlaceHolderImages[0].imageUrl,
  };

  try {
    const textResult = await extractTextFromImage(textExtractionInput);
    console.log('extractTextFromImage concluído com sucesso! Resultado:');
    console.log(JSON.stringify(textResult, null, 2));
  } catch (error) {
    console.error('Erro em extractTextFromImage:', error);
  }

  console.log('\nSimulação concluída.');
}

runSimulation();