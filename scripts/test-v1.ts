
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

async function testLatest() {
    const models = ['gemini-flash-latest', 'gemini-2.0-flash']; // Test both to compare

    for (const model of models) {
        console.log(`\nTesting ${model} on v1beta endpoint...`);
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
                console.log(`✅ SUCCESS: ${model} works!`);
                const data = await response.json();
                console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50));
            } else {
                console.log(`❌ FAILED: ${model} - ${response.status} ${response.statusText}`);
                const err = await response.text();
                // print first 200 chars of error
                console.log('Error details:', err.substring(0, 300));
            }
        } catch (e: any) {
            console.log('Error:', e.message);
        }
    }
}

testLatest();
