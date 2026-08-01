#!/usr/bin/env node
const url = process.argv[2];

if (!url) {
  console.error('Usage: node twilio-url-check.js https://your-public-url/twilio/voice');
  process.exit(1);
}

async function main() {
  const response = await fetch(url, { method: 'POST' });
  const text = await response.text();
  const isXml = (response.headers.get('content-type') || '').includes('text/xml');
  const hasResponse = text.includes('<Response>');
  const hasGather = text.includes('<Gather');
  const hasLocationPrompt = text.includes('Reston or Falls Church');

  console.log(JSON.stringify({
    ok: response.ok && isXml && hasResponse && hasGather && hasLocationPrompt,
    status: response.status,
    contentType: response.headers.get('content-type'),
    isXml,
    hasResponse,
    hasGather,
    hasLocationPrompt,
    preview: text.slice(0, 240)
  }, null, 2));

  if (!(response.ok && isXml && hasResponse && hasGather && hasLocationPrompt)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
