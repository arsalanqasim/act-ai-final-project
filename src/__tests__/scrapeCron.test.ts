import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'http';
import scrapeHandler from '../../api/cron/scrape';

function createMockReqRes(method = 'GET', authHeader?: string) {
  const req = {
    method,
    headers: {
      authorization: authHeader
    }
  } as unknown as IncomingMessage;

  let statusCode = 200;
  let responseData = '';
  const headers: Record<string, string> = {};

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    end(data: string) {
      responseData = data;
    }
  } as unknown as ServerResponse;

  return { req, res, getResult: () => ({ status: statusCode, body: JSON.parse(responseData || '{}') }) };
}

describe('api/cron/scrape', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'test_cron_secret_123' };
  });

  it('rejects unsupported HTTP methods', async () => {
    const { req, res, getResult } = createMockReqRes('DELETE');
    await scrapeHandler(req, res);
    const result = getResult();

    expect(result.status).toBe(405);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('Method not allowed');
  });

  it('rejects unauthorized requests without valid CRON_SECRET bearer token', async () => {
    const { req, res, getResult } = createMockReqRes('GET', 'Bearer wrong_token');
    await scrapeHandler(req, res);
    const result = getResult();

    expect(result.status).toBe(401);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('Unauthorized cron trigger');
  });

  it('returns 503 if Supabase database is not configured', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;

    const { req, res, getResult } = createMockReqRes('GET', 'Bearer test_cron_secret_123');
    await scrapeHandler(req, res);
    const result = getResult();

    expect(result.status).toBe(503);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('Database service role key is not configured');
  });
});
