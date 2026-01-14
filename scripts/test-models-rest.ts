
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

async function main() {
    console.log('--- Model Availability Test ---');

    // Use string names to avoid import issues for now
    const modelsToTest = [
        'gemini-1.5-flash-001',
        'gemini-pro',
        'gemini-1.5-pro-latest'
    ];

    console.log('Importing AI configuration...');
    const { ai } = await import('../src/ai/genkit');

    // We need to override the model in the generate call if possible, 
    // OR we just re-configure a temp instance. 
    // Since 'ai' export is a configured instance, we can't easily change its model 
    // without changing the file.

    // instead, let's use the raw googleAI plugin or just fetch via REST to confirm what works
    // reusing the logic from list-models but for generation

    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

    for (const model of modelsToTest) {
        console.log(`\nTesting ${model}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hello" }] }]
                })
            });

            if (response.ok) {
                console.log(`✅ SUCCESS: ${model} is working!`);
                const data = await response.json();
                console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50));
                // Break on first success? No, let's see all options.
            } else {
                console.log(`❌ FAILED: ${model} - Status ${response.status} ${response.statusText}`);
                const err = await response.text();
                console.log('Error:', err.substring(0, 200));
            }
        } catch (e: any) {
            console.log(`❌ ERROR calling ${model}:`, e.message);
        }
    }
}

main().catch(console.error);
