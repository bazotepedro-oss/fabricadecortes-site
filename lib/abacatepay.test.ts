import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'crypto';
import { mapStatus, verifyWebhookSignature } from './abacatepay';

const webhookSecret = 'unit-test-secret-that-is-at-least-32-characters-long';

afterEach(() => vi.unstubAllEnvs());

describe('AbacatePay webhook authentication', () => {
  it('rejects requests when the webhook secret is not configured', () => {
    vi.stubEnv('ABACATEPAY_WEBHOOK_SECRET', '');
    expect(verifyWebhookSignature('{"data":{}}', null)).toBe(false);
    expect(verifyWebhookSignature('{"data":{}}', null, 'test-secret')).toBe(false);
  });

  it('accepts a valid HMAC and rejects a modified payload', () => {
    vi.stubEnv('ABACATEPAY_WEBHOOK_SECRET', webhookSecret);
    const payload = '{"id":"evt_test","data":{"status":"paid"}}';
    const signature = createHmac('sha256', webhookSecret).update(payload).digest('hex');

    expect(verifyWebhookSignature(payload, signature)).toBe(true);
    expect(verifyWebhookSignature(`${payload} `, signature)).toBe(false);
  });

  it('maps known payment statuses without downgrading them to unknown', () => {
    expect(mapStatus('paid')).toBe('paid');
    expect(mapStatus('refunded')).toBe('refunded');
    expect(mapStatus('not-a-status')).toBe('pending');
  });
});
