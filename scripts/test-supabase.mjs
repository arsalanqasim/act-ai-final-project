import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
console.log("Using key starting with:", supabaseKey ? supabaseKey.substring(0, 15) : "undefined");
console.log("Is service role?", supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY);

const adminClient = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
    console.log("Testing select on profiles...");
    const { data: p, error: pe } = await adminClient.from('profiles').select('id').limit(1).maybeSingle();
    console.log("Profiles error:", pe);

    console.log("Testing insert on custom_opportunities...");
    const { data, error } = await adminClient.from('custom_opportunities').insert({
        id: 'test_opp_123',
        title: 'test',
        organization: 'test',
        category: 'Hackathon',
        deadline: null,
        location: 'Online',
        description: 'test',
        apply_url: 'https://test.com',
        source_url: 'https://test.com',
        normalized_url: 'test.com',
        source_domain: 'test.com',
        source_type: 'official',
        trust_tier: 1,
        trust_score: 100,
        verification_state: 'verified',
        extraction_engine: 'local-heuristic',
        extraction_confidence: 85,
        content_hash: 'test_hash_123'
    });
    console.log("Insert error:", error);
}
testSupabase();
