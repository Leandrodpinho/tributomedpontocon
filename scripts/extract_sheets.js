const XLSX = require('xlsx');
const fs = require('fs');

const FILE_PATH = '/Users/leandropinho/Planejador Tributário/tributomedpontocon/docs/Planilha Planejamento Tributário.xlsx';

try {
    const workbook = XLSX.readFile(FILE_PATH);

    console.log('=== ABAS DISPONÍVEIS ===');
    console.log(workbook.SheetNames.join('\n'));
    console.log('\n');

    // Procurar abas de apresentacao e calculadora
    const targetSheets = workbook.SheetNames.filter(name =>
        name.toLowerCase().includes('apresenta') ||
        name.toLowerCase().includes('calculadora') ||
        name.toLowerCase().includes('calc')
    );

    console.log('=== ABAS ALVO ===');
    console.log(targetSheets.join('\n'));
    console.log('\n');

    const result = {};

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Limitar a 150 linhas para análise
        result[sheetName] = {
            rowCount: data.length,
            preview: data.slice(0, 150)
        };

        console.log(`\n=== ABA: ${sheetName} (${data.length} linhas) ===`);

        // Mostrar primeiras 50 linhas
        data.slice(0, 50).forEach((row, i) => {
            if (row && row.length > 0) {
                console.log(`[${i}] ${JSON.stringify(row)}`);
            }
        });
    }

    fs.writeFileSync('scripts/excel_full_dump.json', JSON.stringify(result, null, 2));
    console.log('\n\nDump completo salvo em scripts/excel_full_dump.json');

} catch (e) {
    console.error('Erro:', e.message);
}
