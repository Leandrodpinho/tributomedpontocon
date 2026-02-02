
import { calculateAgroScenario } from '../src/lib/agro-calculator';
import { calculateSimplesNacional } from '../src/lib/tax-engine/calculators/simples-nacional';
import { calculateHoldingScenario, calculateHoldingProjections } from '../src/lib/holding-calculator';

function runVerification() {
    console.log("=== INICIANDO VERIFICAÇÃO GLOBAL ===");

    // 1. AGRO SCENARIO
    console.log("\n--- 1. AGRO (R$ 1M Receita, R$ 600k Despesa) ---");
    const agro = calculateAgroScenario({
        annualRevenue: 1000000,
        operatingExpenses: 600000,
        investments: 100000,
        priorLosses: 0
    });
    console.log(`LCDPR Tax: ${agro.lcdpr.totalTax.toFixed(2)} (Base: ${agro.lcdpr.taxableBase})`);
    console.log(`Simples Tax: ${agro.simplified.totalTax.toFixed(2)} (Base: ${agro.simplified.taxableBase})`);
    console.log(`Recomendação: ${agro.bestScenario}`);

    // 2. SIMPLES NACIONAL (Medical/Services)
    console.log("\n--- 2. SIMPLES NACIONAL (FATOR R) ---");
    // Caso 1: Fator R < 28% (Anexo V)
    const lowFactor = calculateSimplesNacional(120000, 10000, 'V');
    console.log(`Cenário Baixo Fator R (Receita 10k): Alíquota Eff ${lowFactor.effectiveRate.toFixed(2)}% (Esperado ~15.5%)`);

    // Caso 2: Fator R > 28% (Anexo III)
    const highFactor = calculateSimplesNacional(120000, 10000, 'III');
    console.log(`Cenário Alto Fator R (Receita 10k): Alíquota Eff ${highFactor.effectiveRate.toFixed(2)}% (Esperado ~6%)`);

    // 3. HOLDING PATRIMONIAL
    console.log("\n--- 3. HOLDING (Ativos 10M, Renda 50k/mês) ---");
    const holding = calculateHoldingScenario({
        estateValueMarket: 10000000,
        estateValueBook: 5000000,
        rentalIncome: 50000,
        state: 'SP',
        heirs: 2
    });
    console.log(`PF Mensal Tax: ${holding.pf.monthlyTax.toFixed(2)}`);
    console.log(`Holding Mensal Tax: ${holding.holding.monthlyTax.toFixed(2)}`);
    console.log(`Economia Sucessória: ${holding.savings.successionAmount.toFixed(2)}`);

    // 4. HOLDING FINANCIAL (Projections)
    console.log("\n--- 4. HOLDING PROJECTIONS (1 Ano) ---");
    const proj = calculateHoldingProjections(10000000, 50000, {
        appreciation: 5,
        vacancy: 10,
        maintenance: 1,
        admin: 1200
    });
    const year1 = proj[0];
    console.log(`Ano 1 Net Income: ${year1.netIncome.toFixed(2)}`);
    console.log(`Ano 1 Taxes: ${year1.taxes.toFixed(2)}`);
    console.log(`Ano 1 Maintenance: ${year1.maintenanceCost.toFixed(2)}`);

    console.log("\n=== FIM VERIFICAÇÃO ===");
}

runVerification();
