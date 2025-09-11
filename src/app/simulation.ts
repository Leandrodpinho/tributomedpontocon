// Este arquivo serve para simular a execução dos fluxos de IA.
// Não é parte da aplicação final, mas uma ferramenta de desenvolvimento.

import {
  generateTaxScenarios,
  GenerateTaxScenariosInput,
} from './generate-tax-scenarios';

async function runSimulation() {
  console.log('Iniciando simulação do fluxo generateTaxScenarios...');

  // Use os dados da simulação aqui.
  // Lembre-se de usar números para valores monetários e alíquotas.
  const simulacaoInput: GenerateTaxScenariosInput = {
    clientType: 'Novo aberturas de empresa',
    clientData:
      'Faturamento mensal estimado de R$ 25.000,00. Atividade de clínica médica, sem funcionários no momento.',
    payrollExpenses: 0,
    issRate: 4.0,
    companyName: 'Clínica Saúde Plena',
  };

  try {
    const result = await generateTaxScenarios(simulacaoInput);
    console.log('Simulação concluída com sucesso! Resultado:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Erro durante a simulação:', error);
  }
}

runSimulation();