import 'dotenv/config';
import { test, expect } from '@playwright/test';

test.describe('Zendesk API', () => {
  test('list tickets (API)', async ({ request, baseURL }) => {
    const base = baseURL || process.env.ZENDESK_BASE_URL;
    if (!base) throw new Error('ZENDESK_BASE_URL is not set');

    const email = process.env.ZENDESK_EMAIL;
    const token = process.env.ZENDESK_API_TOKEN;
    if (!email || !token) throw new Error('ZENDESK_EMAIL or ZENDESK_API_TOKEN not set');

    const auth = Buffer.from(`${email}/token:${token}`).toString('base64');

    const res = await request.get(`${base.replace(/\/$/, '')}/api/v2/tickets.json`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    expect(res.ok(), `unexpected status ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body).toBeTruthy();
  });
});
