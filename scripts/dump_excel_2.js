
const XLSX = require('xlsx');
const fs = require('fs');

const FILE_PATH = '/Users/leandropinho/Planejador Tributário/tributomedpontocon/docs/Planilha Planejamento Tributário.xlsx';
const OUT_PATH = 'scripts/excel_dump_2.json';

try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });

    // Dump rows 100-200
    const dump = data.slice(100, 200);

    fs.writeFileSync(OUT_PATH, JSON.stringify(dump, null, 2));
    console.log(`Dumped to ${OUT_PATH}`);

} catch (e) {
    console.error(e);
}
