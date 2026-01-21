
const XLSX = require('xlsx');
const fs = require('fs');

const FILE_PATH = '/Users/leandropinho/Planejador Tributário/tributomedpontocon/docs/Planilha Planejamento Tributário.xlsx';
const OUT_PATH = 'scripts/excel_dump.json';

try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0]; // Planilha1
    console.log(`Dumping sheet: ${sheetName}`);

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });

    // Dump first 100 rows
    const dump = data.slice(0, 100);

    fs.writeFileSync(OUT_PATH, JSON.stringify(dump, null, 2));
    console.log(`Dumped to ${OUT_PATH}`);

} catch (e) {
    console.error(e);
}
