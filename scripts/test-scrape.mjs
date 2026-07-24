import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Parse .env or .env.local manually
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

function loadEnv() {
  loadEnvFile('.env');
  loadEnvFile('.env.local');
}

loadEnv();

import scrapeHandler from '../api/cron/scrape.js';

async function runManualTest() {
  console.log('🚀 Triggering manual test run of /api/cron/scrape scraper...\n');

  const cronSecret = process.env.CRON_SECRET || 'sk_cron_9f8a2b3c4d5abn7p8yy9cf';

  // Mock Request & Response
  const req = {
    method: 'GET',
    headers: {
      authorization: `Bearer ${cronSecret}`
    }
  };

  let statusCode = 200;
  let responseData = '';

  const res = {
    get statusCode() { return statusCode; },
    set statusCode(code) { statusCode = code; },
    setHeader: () => {},
    end: (data) => {
      responseData = data;
    }
  };

  try {
    await scrapeHandler(req, res);
    console.log(`✅ Status Code: ${statusCode}`);
    console.log('📊 Result Payload:');
    console.log(JSON.stringify(JSON.parse(responseData || '{}'), null, 2));
  } catch (err) {
    console.error('❌ Error during manual scrape test:', err);
  }
}

runManualTest();
