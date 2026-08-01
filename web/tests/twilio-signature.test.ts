import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const requireFromHere = createRequire(import.meta.url);
const { computeSignature, requestUrl, validateRequest } = requireFromHere(
  '../../voice-gateway/twilio-signature.js'
);

// Verified against twilio.getExpectedTwilioSignature() from the official SDK.
const TOKEN = '12345';
const URL_WITH_QUERY = 'https://mycompany.com/myapp.php?foo=1&bar=2';
const PARAMS = {
  Digits: '1234',
  To: '+18005551212',
  From: '+14158675310',
  Caller: '+14158675310',
  CallSid: 'CA1234567890ABCDE',
};
const EXPECTED = 'GvWf1cFY/Q7PnoempGyD5oXAezc=';

describe('computeSignature', () => {
  it('matches the Twilio SDK for a signed POST', () => {
    expect(computeSignature(TOKEN, URL_WITH_QUERY, PARAMS)).toBe(EXPECTED);
  });

  it('is independent of parameter insertion order', () => {
    const reordered = {
      CallSid: PARAMS.CallSid,
      From: PARAMS.From,
      To: PARAMS.To,
      Caller: PARAMS.Caller,
      Digits: PARAMS.Digits,
    };
    expect(computeSignature(TOKEN, URL_WITH_QUERY, reordered)).toBe(EXPECTED);
  });
});

describe('validateRequest', () => {
  it('accepts a correctly signed request', () => {
    expect(validateRequest(TOKEN, EXPECTED, URL_WITH_QUERY, PARAMS)).toBe(true);
  });

  it('rejects a tampered parameter', () => {
    expect(validateRequest(TOKEN, EXPECTED, URL_WITH_QUERY, { ...PARAMS, Digits: '9999' })).toBe(false);
  });

  it('rejects a signature computed for a different URL', () => {
    expect(validateRequest(TOKEN, EXPECTED, 'https://attacker.example/myapp.php', PARAMS)).toBe(false);
  });

  it('rejects a wrong auth token', () => {
    expect(validateRequest('wrong-token', EXPECTED, URL_WITH_QUERY, PARAMS)).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(validateRequest(TOKEN, undefined, URL_WITH_QUERY, PARAMS)).toBe(false);
  });

  it('rejects a signature of a different length without throwing', () => {
    expect(validateRequest(TOKEN, 'short', URL_WITH_QUERY, PARAMS)).toBe(false);
  });
});

describe('requestUrl', () => {
  const req = {
    url: '/twilio/voice/location?language=vi',
    headers: { host: 'internal:10000', 'x-forwarded-proto': 'https', 'x-forwarded-host': 'linh.onrender.com' },
  };

  it('prefers PUBLIC_BASE_URL, which is what Twilio was configured with', () => {
    expect(requestUrl(req, 'https://linh.onrender.com')).toBe(
      'https://linh.onrender.com/twilio/voice/location?language=vi'
    );
  });

  it('falls back to the forwarded host and proto behind the proxy', () => {
    expect(requestUrl(req, '')).toBe('https://linh.onrender.com/twilio/voice/location?language=vi');
  });
});
