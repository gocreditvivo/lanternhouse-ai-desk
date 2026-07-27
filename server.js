#!/usr/bin/env node
const http = require('http');
const { URL } = require('url');

const env = process.env;
const PORT = Number(env.PORT || 10000);
const PUBLIC_BASE_URL = String(env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
const TWILIO_MANAGER_PHONE = env.TWILIO_MANAGER_PHONE || '+15717495444';
const TWILIO_CALLER_ID = env.TWILIO_CALLER_ID || '';

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function twiml(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
}

function say(text) {
  return `<Say voice="alice" language="en-US">${xmlEscape(text)}</Say>`;
}

function publicAction(pathname) {
  return PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}${pathname}` : pathname;
}

function gather({ action, prompt, timeout = 5, hints = '' }) {
  const hintAttr = hints ? ` hints="${xmlEscape(hints)}"` : '';
  return `<Gather input="speech dtmf" action="${xmlEscape(action)}" method="POST" timeout="${timeout}" speechTimeout="auto" actionOnEmptyResult="true"${hintAttr}>${say(prompt)}</Gather>`;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}

function sendXml(res, status, xml) {
  res.writeHead(status, {
    'Content-Type': 'text/xml; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(xml);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readForm(req) {
  const body = await readBody(req);
  return Object.fromEntries(new URLSearchParams(body).entries());
}

function normalizeSpeech(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectLocation(form) {
  const speech = normalizeSpeech(form.SpeechResult || form.UnstableSpeechResult || '');
  const digits = String(form.Digits || '').trim();
  if (digits === '1' || speech.includes('reston')) return 'Reston';
  if (digits === '2' || speech.includes('falls') || speech.includes('church')) return 'Falls Church';
  return '';
}

function shouldTransferToManager(form) {
  const speech = normalizeSpeech(form.SpeechResult || form.UnstableSpeechResult || '');
  const digits = String(form.Digits || '').trim();
  return digits === '9' || /manager|owner|complaint|refund|wrong|missing|police|health|emergency|uber|doordash|driver|payment|stuck/.test(speech);
}

async function route(req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'lanternhouse-ai-desk',
      publicBaseUrl: PUBLIC_BASE_URL || null,
      ts: new Date().toISOString(),
    });
    return;
  }

  if ((req.method === 'GET' || req.method === 'POST') && url.pathname === '/twilio/voice') {
    sendXml(res, 200, twiml(
      gather({
        action: publicAction('/twilio/voice/location'),
        prompt: 'Thank you for calling Lantern House. This is Linh. This call may be recorded for training and service quality. Are you calling for our Reston or Falls Church location? You can also press 1 for Reston or 2 for Falls Church.',
        hints: 'Reston,Falls Church,Lantern House,Vietnamese,restaurant',
      }) +
      say('I did not hear a location. Please call again, or press 1 for Reston and 2 for Falls Church next time.')
    ));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/twilio/voice/location') {
    const form = await readForm(req);
    const location = detectLocation(form);
    if (!location) {
      sendXml(res, 200, twiml(
        gather({
          action: publicAction('/twilio/voice/location'),
          prompt: 'I want to route you correctly. Please say Reston or Falls Church, or press 1 for Reston and 2 for Falls Church.',
          hints: 'Reston,Falls Church',
        }) +
        say('I still could not confirm the location. I will end this test call now.')
      ));
      return;
    }

    sendXml(res, 200, twiml(
      gather({
        action: publicAction(`/twilio/voice/intent?location=${encodeURIComponent(location)}`),
        prompt: `Thank you. I have ${location}. In this test mode, say order, menu, catering, complaint, manager, or press 9 to test manager transfer.`,
        hints: 'order,menu,catering,complaint,manager,owner,Uber,DoorDash,driver,allergy,gluten free',
      }) +
      say('I did not hear a request. This Twilio test is connected.')
    ));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/twilio/voice/intent') {
    const form = await readForm(req);
    const location = url.searchParams.get('location') || 'the selected location';
    if (shouldTransferToManager(form)) {
      if (/^\+\d{10,15}$/.test(TWILIO_MANAGER_PHONE)) {
        const callerId = TWILIO_CALLER_ID ? ` callerId="${xmlEscape(TWILIO_CALLER_ID)}"` : '';
        sendXml(res, 200, twiml(
          say(`I will get the restaurant team for ${location}. One moment please.`) +
          `<Dial${callerId}>${xmlEscape(TWILIO_MANAGER_PHONE)}</Dial>` +
          say('The manager was not available. Please leave your name and phone number after the tone.')
        ));
        return;
      }
      sendXml(res, 200, twiml(say('Manager transfer is not configured yet.')));
      return;
    }

    sendXml(res, 200, twiml(
      say(`Good. Linh test mode is connected for ${location}. Full AI ordering, SMS links, and live menu answers connect after the production voice provider is configured.`)
    ));
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    console.error(error);
    sendJson(res, 500, { error: 'internal_error', message: error.message });
  });
});

server.listen(PORT, () => {
  console.log(`Lantern House AI Desk listening on port ${PORT}`);
});
