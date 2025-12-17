
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
        // Unfortunately the SDK doesn't expose listModels trivially in the main class in all versions, 
        // but we can try to use the model manager if available or just infer from documentation.
        // Actually, older SDKs didn't have listModels. Let's try to just hit the endpoint via fetch if needed.
        // But let's try a direct test of "gemini-1.5-flash" again with the full "models/" prefix which sometimes helps.

        const modelsToCheck = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002",
            "gemini-pro",
            "models/gemini-1.5-flash",
            "models/gemini-pro"
        ];

        for (const modelName of modelsToCheck) {
            console.log(`Checking ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Test");
                console.log(`✅ SUCCESS: ${modelName}`);
                await result.response;
                break; // Found one!
            } catch (e: any) {
                console.log(`❌ FAILED: ${modelName} - ${e.status || e.message}`);
                if (e.response) {
                    console.log('Error details:', JSON.stringify(await e.response.json(), null, 2));
                } else {
                    console.log('Full error:', JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
                }
            }
        }

    } catch (error) {
        console.error("LIST FAILED:", error);
    }
}

listModels();
