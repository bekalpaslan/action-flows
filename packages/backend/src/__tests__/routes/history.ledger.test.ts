import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../index.js';

describe('GET /api/history/ledger (D-05)', () => {
  it('returns 200 with an entries array', async () => {
    const res = await request(app).get('/api/history/ledger');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });

  it('supports gateId filter', async () => {
    const res = await request(app).get(
      '/api/history/ledger?gateId=gate-04',
    );
    expect(res.status).toBe(200);
  });
});
