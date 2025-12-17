
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("NO GOOGLE_API_KEY FOUND IN .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testGeneration() {
    const modelName = "gemini-pro"; // Fallback to classic
    console.log(`Testing generation with model: ${modelName}`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'Hello World' if you can hear me.");
        const response = await result.response;
        const text = response.text();
        console.log("SUCCESS:");
        console.log(text);
    } catch (error) {
        console.error("GENERATION FAILED:");
        console.error(error);
    }
}

testGeneration();
