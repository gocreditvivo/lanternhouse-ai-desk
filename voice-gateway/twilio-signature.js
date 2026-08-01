'use strict';

/**
 * Twilio request-signature validation.
 *
 * Implements the algorithm Twilio documents for X-Twilio-Signature, matching
 * `twilio.validateRequest` from the SDK: take the full request URL, append each
 * POST parameter's name and value in alphabetical order by name, HMAC-SHA1 the
 * result with the account auth token, and base64-encode it.
 *
 * Written against node's crypto rather than pulling in the twilio SDK: the
 * gateway currently ships with zero runtime dependencies, and a missing
 * `npm install` on the deploy host would take the phone line down at startup.
 */

const crypto = require('crypto');

function signatureBase(url, params) {
  return Object.keys(params || {})
    .sort()
    .reduce((acc, key) => acc + key + (params[key] == null ? '' : params[key]), String(url));
}

function computeSignature(authToken, url, params) {
  return crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(signatureBase(url, params), 'utf8'))
    .digest('base64');
}

function validateRequest(authToken, signature, url, params) {
  if (!authToken || !signature) return false;

  const expected = Buffer.from(computeSignature(authToken, url, params), 'utf8');
  const actual = Buffer.from(String(signature), 'utf8');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/**
 * Rebuild the URL Twilio signed. Twilio signs the exact URL configured on the
 * number, so PUBLIC_BASE_URL wins when set; otherwise fall back to the
 * forwarded host/proto, since the gateway runs behind a TLS-terminating proxy.
 */
function requestUrl(req, publicBaseUrl) {
  if (publicBaseUrl) return `${publicBaseUrl}${req.url}`;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}${req.url}`;
}

module.exports = { computeSignature, requestUrl, signatureBase, validateRequest };
