import { GoogleGenAI } from '@google/genai';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile(file) {
  const envPath = resolve(process.cwd(), file);
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = val;
      }
    }
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const response = await ai.models.list();
    // In @google/genai, the response itself might be an array or async iterable of model objects
    for await (const m of response) {
      if (m.name.startsWith('models/gemini')) {
         console.log(m.name);
      }
    }
  } catch (err) {
    console.error("Error listing models:", err.message || err);
  }
}

listModels();
