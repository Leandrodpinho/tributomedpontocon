
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('No API Key found');
    process.exit(1);
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log('Available Models:');
            data.models.forEach((m: any) => {
                if (m.name.includes('gemini')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                    console.log(`  Supported: ${m.supportedGenerationMethods.join(', ')}`);
                }
            });
        } else {
            console.log('No models found or error:', data);
        }
    } catch (e) {
        console.error('Error fetching models:', e);
    }
}

listModels();
