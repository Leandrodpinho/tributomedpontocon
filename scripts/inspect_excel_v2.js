
const XLSX = require('xlsx');
const fs = require('fs');

const FILE_PATH = '/Users/leandropinho/Planejador Tributário/tributomedpontocon/docs/Planilha Planejamento Tributário.xlsx';

try {
    const workbook = XLSX.readFile(FILE_PATH);
    console.log("SHEETS:", workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n=== SHEET: ${sheetName} ===`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });

        // Print distinct non-empty rows
        const nonEmpty = data.filter(row => row.length > 0 && row.some(x => x));

        nonEmpty.slice(0, 15).forEach((row, i) => {
            console.log(`R${i}: ${JSON.stringify(row)}`);
        });
    });

} catch (e) {
    console.error(e);
}
