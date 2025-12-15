
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("NO GOOGLE_API_KEY FOUND IN .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // There isn't a direct "listModels" on the client usually, but we can try to "countTokens" or similar to check validity, 
        // OR we can just try to hit the list endpoint if the SDK supports it. 
        // Actually the SDK doesn't always expose listModels directly in the high level client.

        // Let's use fetch directly to be sure.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            console.error(`Error listing models: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }
        const data = await response.json();
        const models = data.models.filter((m: any) => m.name.includes("1.5"));
        console.log("AVAILABLE 1.5 MODELS:");
        models.forEach((m: any) => {
            console.log(`- ${m.name}`);
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
