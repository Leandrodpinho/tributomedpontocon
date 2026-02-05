
// Polyfill DOMMatrix for pdf-parse in Node environment
if (typeof DOMMatrix === "undefined") {
    (global as unknown as Record<string, unknown>).DOMMatrix = class DOMMatrix {
        constructor() { }
        toString() { return ""; }
    };
}

// Dynamic import for pdf-parse to work with Next.js/Turbopack
type PdfParseResult = { text: string };
type PdfParseFunction = (buffer: Buffer) => Promise<PdfParseResult>;
let pdf: PdfParseFunction | null = null;

async function loadPdfParse(): Promise<PdfParseFunction | null> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        return pdfParse as PdfParseFunction;
    } catch (e) {
        console.error("Failed to load pdf-parse:", e);
        return null;
    }
}

import { fromBuffer } from "pdf2pic";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
    // Load pdf-parse dynamically
    const pdfParser = pdf || await loadPdfParse();
    pdf = pdfParser;

    // If pdf-parse failed to load, skip directly to OCR
    if (!pdfParser) {
        console.warn("pdf-parse not available, using OCR directly");
        return await ocrPdf(buffer);
    }

    try {
        // 1. Try fast extraction with pdf-parse
        // pdf-parse library acts on a buffer and returns a promise with text
        const data = await pdfParser(buffer);
        const text = (data.text || "").trim();

        // Heuristic: If generated text is too short (< 50 chars) or seems like garbage,
        // it's likely a scanned PDF / image. Fallback to OCR.
        // Also check if text is just whitespace.
        if (text.length > 50) {
            return text;
        }
        console.log("PDF text too short, falling back to OCR...");
    } catch (error) {
        console.warn("pdf-parse failed, falling back to OCR", error);
    }

    // 2. Fallback to Tesseract OCR
    return await ocrPdf(buffer);
}

export async function ocrPdf(buffer: Buffer): Promise<string> {
    // Create a unique temporary directory
    const uniqueId = Math.random().toString(36).substring(7);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ocr-" + uniqueId + "-"));

    // Options for pdf2pic
    const options = {
        density: 300,
        savePath: tmpDir,
        format: "png",
        width: 2480,
        height: 3508
    };

    const imgs: string[] = [];
    try {
        const converter = fromBuffer(buffer, options);

        // Convert first 3 pages to avoid timeout on large docs
        const pagesToScan = [1, 2, 3];

        // Note: pdf2pic convert method usually returns { name, size, fileSize, path, page }
        // We execute sequentially to keep order
        for (const pageNum of pagesToScan) {
            try {
                const result = await converter(pageNum, { responseType: "image" });
                if (result && result.path) {
                    imgs.push(result.path);
                }
            } catch {
                // Page might not exist (e.g. 1 page pdf), just continue
            }
        }

        if (imgs.length === 0) {
            return "";
        }

        let fullText = "";
        for (const imgPath of imgs) {
            // Execute tesseract CLI
            // Try Portuguese first, then English
            try {
                const { stdout } = await execFileAsync("tesseract", [imgPath, "stdout", "-l", "por"]);
                fullText += "\n" + stdout;
            } catch (err) {
                console.warn(`Tesseract 'por' failed for ${imgPath}, trying 'eng'`, err);
                try {
                    const { stdout } = await execFileAsync("tesseract", [imgPath, "stdout", "-l", "eng"]);
                    fullText += "\n" + stdout;
                } catch (e2) {
                    console.error(`Tesseract failed for ${imgPath}`, e2);
                }
            }
        }

        return fullText.trim();

    } catch (error) {
        console.error("OCR process failed:", error);
        return "";
    } finally {
        // Cleanup tmp dir
        try {
            await fs.rm(tmpDir, { recursive: true, force: true });
        } catch (e) { console.error("Failed to cleanup OCR tmp dir", e); }
    }
}
