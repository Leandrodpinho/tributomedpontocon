
const XLSX = require('xlsx');
const fs = require('fs');

const FILE_PATH = '/Users/leandropinho/Planejador Tributário/tributomedpontocon/docs/Planilha Planejamento Tributário.xlsx';

try {
    if (!fs.existsSync(FILE_PATH)) {
        console.error("Arquivo não encontrado:", FILE_PATH);
        process.exit(1);
    }

    const workbook = XLSX.readFile(FILE_PATH);
    console.log("Planilhas encontradas:", workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Planilha: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];

        // Converte para JSON array de arrays (linhas)
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 }); // range 0 = everything

        // Print first 30 rows to understand layout
        data.slice(0, 30).forEach((row, index) => {
            // Filtra linhas vazias para economizar visualização
            if (row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
                console.log(`Linha ${index + 1}:`, JSON.stringify(row));
            }
        });
    });

} catch (e) {
    console.error("Erro ao ler excel:", e);
}
