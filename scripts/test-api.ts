
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env.local from the current working directory
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn("Warning: Could not load .env.local file. Checking only process.env");
}

async function main() {
    console.log('--- API Diagnostics ---');

    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('❌ CRITICAL: No API key found in GOOGLE_GENAI_API_KEY or GOOGLE_API_KEY.');
        console.error('Please check your .env.local file.');
        process.exit(1);
    } else {
        console.log('✅ API Key found in environment variables.');
    }

    console.log('Importing AI configuration...');
    try {
        // Dynamic import to ensure env vars are set before Genkit initializes
        const { ai } = await import('../src/ai/genkit');

        console.log('Values loaded. Testing generation with configured model...');
        console.log('Attempting to contact Gemini API...');

        // Simple generation request
        const response = await ai.generate({
            prompt: 'Reply with "OK" if you receive this message.',
            config: {
                temperature: 0.1,
                maxOutputTokens: 10
            }
        });

        console.log('Response received:');
        console.log('-------------------');
        console.log(response.text);
        console.log('-------------------');
        console.log('✅ SUCCESS: API Key and Model are working correctly.');

    } catch (error: any) {
        console.error('\n❌ ERROR: Failed to communicate with API.');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);

        if (error.message.includes('Quota exceeded')) {
            console.error('⚠️ DIAGNOSIS: The API key has exceeded its quota (Free Tier limit or other).');
            console.error('Action: You may need to wait or use a different API key/Project.');
        } else if (error.message.includes('API key not valid')) {
            console.error('⚠️ DIAGNOSIS: The API key is invalid.');
        }

        // Print full error for details
        // console.error('Full Error:', JSON.stringify(error, null, 2));
    }
}

main().catch(err => console.error(err));
