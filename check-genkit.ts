
import { ai } from './src/ai/genkit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars manually since we are running via tsx
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('Testing Genkit generation...');
    try {
        const { text } = await ai.generate('Say "Genkit works!"');
        console.log('SUCCESS:', text);
    } catch (error) {
        console.error('FAILURE:', error);
    }
}

main();
