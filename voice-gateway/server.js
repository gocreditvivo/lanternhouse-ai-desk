#!/usr/bin/env node
const http = require('http');
const { URL } = require('url');
const { requestUrl, validateRequest } = require('./twilio-signature');

const env = process.env;
const PORT = Number(env.PORT || 10000);
const PUBLIC_BASE_URL = String(env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
const TWILIO_AUTH_TOKEN = env.TWILIO_AUTH_TOKEN || '';
const TWILIO_MANAGER_PHONE = env.TWILIO_MANAGER_PHONE || '+15717495444';
const TWILIO_CALLER_ID = env.TWILIO_CALLER_ID || '';
const VIETNAMESE_LANGUAGE = env.TWILIO_VIETNAMESE_LANGUAGE || 'vi-VN';

const VAPI_API_KEY = env.VAPI_API_KEY || '';
const VAPI_ASSISTANT_ID = env.VAPI_ASSISTANT_ID || '';
const VAPI_STREAM_URL = env.VAPI_STREAM_URL || 'wss://api.vapi.ai/twilio/inbound_call';
// Kill switch: set VAPI_ENABLED=false on Render to fall back to the test IVR without a redeploy.
const vapiEnabled = () => env.VAPI_ENABLED !== 'false' && Boolean(VAPI_API_KEY && VAPI_ASSISTANT_ID);

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

function say(text, language = 'en-US') {
  const voice = language === 'en-US' ? ' voice="alice"' : '';
  return `<Say${voice} language="${xmlEscape(language)}">${xmlEscape(text)}</Say>`;
}

function sayLang(text, language) {
  return language === 'vi' ? say(text, VIETNAMESE_LANGUAGE) : say(text, 'en-US');
}

function publicAction(pathname) {
  return PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}${pathname}` : pathname;
}

function gather({ action, prompt, timeout = 5, hints = '', language = 'en' }) {
  const hintAttr = hints ? ` hints="${xmlEscape(hints)}"` : '';
  return `<Gather input="speech dtmf" action="${xmlEscape(action)}" method="POST" timeout="${timeout}" speechTimeout="auto" actionOnEmptyResult="true"${hintAttr}>${sayLang(prompt, language)}</Gather>`;
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

let warnedMissingAuthToken = false;

/**
 * Confirm an inbound /twilio/voice* request really came from Twilio.
 *
 * Fails open when TWILIO_AUTH_TOKEN is unset so local runs and the test IVR
 * keep working — an unset token must never silently drop live calls. Once the
 * token is set, unsigned or mis-signed requests are rejected with 403.
 */
function isSignedByTwilio(req, form) {
  if (!TWILIO_AUTH_TOKEN) {
    if (!warnedMissingAuthToken) {
      warnedMissingAuthToken = true;
      console.warn('TWILIO_AUTH_TOKEN is not set — inbound Twilio requests are NOT signature-verified.');
    }
    return true;
  }

  // Twilio signs POST params; for GET it signs the URL with its query string only.
  const params = req.method === 'POST' ? form : {};
  return validateRequest(TWILIO_AUTH_TOKEN, req.headers['x-twilio-signature'], requestUrl(req, PUBLIC_BASE_URL), params);
}

function normalizeSpeech(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectLanguage(form) {
  const speech = normalizeSpeech(form.SpeechResult || form.UnstableSpeechResult || '');
  const digits = String(form.Digits || '').trim();
  if (digits === '3' || speech.includes('vietnamese') || speech.includes('tieng viet') || speech.includes('viet nam')) return 'vi';
  return 'en';
}

function languageFromUrl(url) {
  return url.searchParams.get('language') === 'vi' ? 'vi' : 'en';
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
  return digits === '9' || /manager|owner|complaint|refund|wrong|missing|police|health|emergency|uber|doordash|driver|payment|stuck|quan ly|chu|khieu nai|hoan tien|sai mon|thieu mon|canh sat|khan cap/.test(speech);
}

function locationPrompt(language) {
  if (language === 'vi') {
    return 'Cảm ơn quý khách đã gọi Lantern House. Quý khách gọi cho chi nhánh Reston hay Falls Church? Bấm 1 cho Reston, hoặc bấm 2 cho Falls Church.';
  }
  return 'Thank you for calling Lantern House. This is Linh. This call may be recorded for training and service quality. Are you calling for our Reston or Falls Church location? You can press 1 for Reston, 2 for Falls Church, or 3 for Vietnamese.';
}

function intentPrompt(location, language) {
  if (language === 'vi') {
    return `Cảm ơn quý khách. Em đã ghi nhận chi nhánh ${location}. Hiện đang ở chế độ thử nghiệm. Quý khách có thể nói đặt món, thực đơn, catering, khiếu nại, quản lý, hoặc bấm 9 để thử chuyển cho quản lý.`;
  }
  return `Thank you. I have ${location}. In this test mode, say order, menu, catering, complaint, manager, or press 9 to test manager transfer.`;
}

function connectedPrompt(location, language) {
  if (language === 'vi') {
    return `Tốt rồi. Linh đã kết nối thử nghiệm cho chi nhánh ${location}. Chức năng đặt món bằng trí tuệ nhân tạo, gửi tin nhắn, và trả lời thực đơn trực tiếp sẽ được kết nối sau khi cấu hình hệ thống chính thức.`;
  }
  return `Good. Linh test mode is connected for ${location}. Full AI ordering, SMS links, and live menu answers connect after the production voice provider is configured.`;
}

// Hands the live audio stream to the Vapi assistant. If the stream drops (Vapi down,
// bad credentials), Twilio continues past <Connect> and we fall through to the IVR.
function vapiConnectTwiml(form) {
  const params = [
    ['assistantId', VAPI_ASSISTANT_ID],
    ['apiKey', VAPI_API_KEY],
    ['callerNumber', form.From || ''],
    ['calledNumber', form.To || ''],
    ['twilioCallSid', form.CallSid || ''],
  ]
    .filter(([, value]) => value)
    .map(([name, value]) => `<Parameter name="${xmlEscape(name)}" value="${xmlEscape(value)}"/>`)
    .join('');

  return twiml(
    `<Connect><Stream url="${xmlEscape(VAPI_STREAM_URL)}">${params}</Stream></Connect>` +
    say('Sorry, our assistant could not pick up. Let me try again.') +
    `<Redirect method="POST">${xmlEscape(publicAction('/twilio/voice/ivr'))}</Redirect>`
  );
}

function testModeIvrTwiml() {
  return twiml(
    gather({
      action: publicAction('/twilio/voice/language'),
      prompt: 'Thank you for calling Lantern House. This is Linh. For English, stay on the line or press 1. For Vietnamese, press 3.',
      hints: 'English,Vietnamese,Reston,Falls Church,Lantern House',
    }) +
    say('I did not hear a selection. I will continue in English.') +
    gather({ action: publicAction('/twilio/voice/location?language=en'), prompt: locationPrompt('en'), hints: 'Reston,Falls Church' })
  );
}

async function route(req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'lanternhouse-ai-desk',
      mode: vapiEnabled() ? 'vapi' : 'test-ivr',
      vapiEnabled: vapiEnabled(),
      publicBaseUrl: PUBLIC_BASE_URL || null,
      ts: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === '/twilio/voice' || url.pathname.startsWith('/twilio/voice/')) {
    // Read the body once here: the signature covers the POST parameters, and the
    // request stream can only be consumed a single time.
    const form = req.method === 'POST' ? await readForm(req) : {};
    if (!isSignedByTwilio(req, form)) {
      console.warn(`Rejected request with an invalid Twilio signature: ${req.method} ${url.pathname}`);
      sendJson(res, 403, { error: 'invalid_twilio_signature' });
      return;
    }
    await routeTwilioVoice(req, res, url, form);
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
}

async function routeTwilioVoice(req, res, url, form) {
  if ((req.method === 'GET' || req.method === 'POST') && url.pathname === '/twilio/voice') {
    if (vapiEnabled()) {
      sendXml(res, 200, vapiConnectTwiml(form));
      return;
    }
    sendXml(res, 200, testModeIvrTwiml());
    return;
  }

  if ((req.method === 'GET' || req.method === 'POST') && url.pathname === '/twilio/voice/ivr') {
    sendXml(res, 200, testModeIvrTwiml());
    return;
  }

  if (req.method === 'POST' && url.pathname === '/twilio/voice/language') {
    const language = detectLanguage(form);
    sendXml(res, 200, twiml(
      gather({ action: publicAction(`/twilio/voice/location?language=${language}`), prompt: locationPrompt(language), hints: 'Reston,Falls Church', language }) +
      sayLang(language === 'vi' ? 'Em chưa nghe rõ chi nhánh. Xin gọi lại, hoặc bấm 1 cho Reston và 2 cho Falls Church.' : 'I did not hear a location. Please call again, or press 1 for Reston and 2 for Falls Church next time.', language)
    ));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/twilio/voice/location') {
    const language = languageFromUrl(url);
    const location = detectLocation(form);
    if (!location) {
      sendXml(res, 200, twiml(
        gather({ action: publicAction(`/twilio/voice/location?language=${language}`), prompt: language === 'vi' ? 'Em muốn chuyển đúng chi nhánh. Xin nói Reston hoặc Falls Church, hoặc bấm 1 cho Reston và 2 cho Falls Church.' : 'I want to route you correctly. Please say Reston or Falls Church, or press 1 for Reston and 2 for Falls Church.', hints: 'Reston,Falls Church', language }) +
        sayLang(language === 'vi' ? 'Em vẫn chưa xác nhận được chi nhánh. Em sẽ kết thúc cuộc gọi thử nghiệm này.' : 'I still could not confirm the location. I will end this test call now.', language)
      ));
      return;
    }
    sendXml(res, 200, twiml(
      gather({ action: publicAction(`/twilio/voice/intent?location=${encodeURIComponent(location)}&language=${language}`), prompt: intentPrompt(location, language), hints: 'order,menu,catering,complaint,manager,owner,Uber,DoorDash,driver,allergy,gluten free', language }) +
      sayLang(language === 'vi' ? 'Em chưa nghe rõ yêu cầu. Kết nối thử nghiệm Twilio đã hoạt động.' : 'I did not hear a request. This Twilio test is connected.', language)
    ));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/twilio/voice/intent') {
    const language = languageFromUrl(url);
    const location = url.searchParams.get('location') || 'the selected location';
    if (shouldTransferToManager(form)) {
      if (/^\+\d{10,15}$/.test(TWILIO_MANAGER_PHONE)) {
        const callerId = TWILIO_CALLER_ID ? ` callerId="${xmlEscape(TWILIO_CALLER_ID)}"` : '';
        sendXml(res, 200, twiml(
          sayLang(language === 'vi' ? `Em sẽ chuyển quý khách cho đội ngũ nhà hàng tại ${location}. Xin chờ một chút.` : `I will get the restaurant team for ${location}. One moment please.`, language) +
          `<Dial${callerId}>${xmlEscape(TWILIO_MANAGER_PHONE)}</Dial>` +
          sayLang(language === 'vi' ? 'Quản lý hiện chưa nghe máy. Xin để lại tên và số điện thoại sau tiếng bíp.' : 'The manager was not available. Please leave your name and phone number after the tone.', language)
        ));
        return;
      }
      sendXml(res, 200, twiml(sayLang(language === 'vi' ? 'Chức năng chuyển cho quản lý chưa được cấu hình.' : 'Manager transfer is not configured yet.', language)));
      return;
    }
    sendXml(res, 200, twiml(sayLang(connectedPrompt(location, language), language)));
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
