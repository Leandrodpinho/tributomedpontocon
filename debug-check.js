
// Polyfill needed for pdf-parse to even import without crashing sometimes
if (typeof DOMMatrix === "undefined") {
    global.DOMMatrix = class DOMMatrix { constructor() { } toString() { return ""; } };
}

const pdfParse = require("pdf-parse");

console.log("Type of pdf-parse export:", typeof pdfParse);
console.log("Is it a function?", typeof pdfParse === 'function');
console.log("Keys:", Object.keys(pdfParse));
if (pdfParse.default) {
    console.log("Type of .default:", typeof pdfParse.default);
}
