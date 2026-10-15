import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../public/js/contact-form.js', import.meta.url), 'utf8');
function harness({ country = 'bw', endpoint = 'https://mail.example.test/send', fetchImpl = async () => ({ ok: true, text: async () => JSON.stringify({ messageId: '<test@example.test>' }) }) } = {}) {
  const fields = Object.fromEntries(Object.entries({ name: ' Test <Visitor> ', email: 'visitor@example.test', mobile: '+267 74 178 111', subject: ' Test & enquire ', message: ' Line one\n<script>alert(1)</script> ' }).map(([name, value]) => [name, {
    value, validityMessage: '', setCustomValidity(message) { this.validityMessage = message; },
  }]));
  const events = {}, attrs = {}, requests = [];
  const label = { textContent: 'Send Message' }, classes = new Set(['d-none']);
  const spinner = { classList: { add: x => classes.add(x), remove: x => classes.delete(x) } };
  const button = { disabled: true, querySelector: selector => selector === 'span' ? label : spinner };
  const status = { textContent: '' }, fieldset = { disabled: false };
  const form = {
    resetCount: 0, elements: { namedItem: name => fields[name] },
    querySelector: selector => selector === 'fieldset' ? fieldset : selector === '.js-contact-status' ? status : button,
    addEventListener: (event, handler) => { events[event] = handler; },
    reportValidity: () => Object.values(fields).every(field => field.value && !field.validityMessage),
    setAttribute: (name, value) => { attrs[name] = value; }, removeAttribute: name => { delete attrs[name]; },
    reset() { this.resetCount++; Object.values(fields).forEach(field => { field.value = ''; }); },
  };
  let timer;
  vm.runInNewContext(script, {
    document: { documentElement: { dataset: { siteCountry: country, contactFormEndpoint: endpoint } }, querySelectorAll: () => [form] },
    URL, AbortController,
    FormData: class { constructor() { assert.equal(fieldset.disabled, false, 'Serialize before disabling controls'); } get(name) { return fields[name].value; } },
    setTimeout: callback => { timer = callback; return 1; }, clearTimeout: () => { timer = undefined; },
    fetch: async (...args) => { requests.push(args); return fetchImpl(...args); },
  });
  return { fields, form, button, fieldset, status, label, requests, attrs, classes, events, expire: () => timer(), submit: () => events.submit({ preventDefault() {} }) };
}

for (const country of ['bw', 'zw']) test(`${country}: expected mail contract, escaping and success reset`, async () => {
  const h = harness({ country });
  assert.equal(h.button.disabled, false);
  await h.submit();
  const [endpoint, request] = h.requests[0];
  assert.equal(endpoint, 'https://mail.example.test/send');
  assert.equal(request.method, 'POST');
  assert.equal(request.credentials, 'omit');
  assert.equal(request.headers['Content-Type'], 'application/json');
  const payload = JSON.parse(request.body);
  assert.deepEqual(Object.keys(payload).sort(), ['email', 'html', 'name', 'subject', 'text']);
  assert.equal(payload.name, 'Test <Visitor>');
  assert.ok(payload.text.includes(`Country: ${country.toUpperCase()}`));
  assert.ok(payload.text.includes('Mobile: +267 74 178 111'));
  assert.ok(payload.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(payload.html.includes('Line one<br>'));
  assert.equal(h.form.resetCount, 1);
  assert.match(h.status.textContent, /submitted successfully/);
  assert.equal(h.fieldset.disabled, false);
  assert.equal(h.attrs['aria-busy'], undefined);
  assert.ok(h.classes.has('d-none'));
});

test('duplicate submits are suppressed while controls are locked', async () => {
  let resolve;
  const h = harness({ fetchImpl: () => new Promise(done => { resolve = done; }) });
  const pending = h.submit();
  assert.equal(h.fieldset.disabled, true);
  assert.equal(h.button.disabled, true);
  assert.equal(h.attrs['aria-busy'], 'true');
  await h.submit();
  assert.equal(h.requests.length, 1);
  resolve({ ok: true, text: async () => '{"messageId":"receipt"}' });
  await pending;
});

for (const code of [400, 403, 429, 500]) test(`HTTP ${code} retains the enquiry and restores controls`, async () => {
  const h = harness({ fetchImpl: async () => ({ ok: false, status: code }) });
  await h.submit();
  assert.equal(h.form.resetCount, 0);
  assert.ok(h.fields.message.value.includes('Line one'));
  assert.equal(h.button.disabled, false);
  assert.equal(h.label.textContent, 'Send Message');
  assert.match(h.status.textContent, code === 429 ? /Too many requests/ : /could not send/);
});

for (const body of ['<html>Error</html>', '{}', '{"error":"failed"}', '{"messageId":""}']) test(`unexpected success response is not claimed as sent: ${body}`, async () => {
  const h = harness({ fetchImpl: async () => ({ ok: true, text: async () => body }) });
  await h.submit();
  assert.equal(h.form.resetCount, 0);
  assert.match(h.status.textContent, /could not confirm/);
});

test('timeout preserves data, avoids automatic retry and acknowledges uncertain delivery', async () => {
  const h = harness({ fetchImpl: (_, request) => new Promise((_, reject) => {
    request.signal.addEventListener('abort', () => reject(new Error('aborted')));
  }) });
  const pending = h.submit();
  h.expire();
  await pending;
  assert.equal(h.requests.length, 1);
  assert.equal(h.form.resetCount, 0);
  assert.equal(h.button.disabled, false);
  assert.match(h.status.textContent, /could not confirm/);
});

test('network failure preserves the enquiry', async () => {
  const h = harness({ fetchImpl: async () => { throw new TypeError('network'); } });
  await h.submit();
  assert.equal(h.form.resetCount, 0);
  assert.match(h.status.textContent, /could not confirm/);
});

test('blank fields and invalid phone numbers never send', async () => {
  const h = harness();
  h.fields.name.value = '   ';
  await h.submit();
  assert.equal(h.requests.length, 0);
  h.fields.name.value = 'Test';
  h.fields.mobile.value = 'abc123';
  await h.submit();
  assert.equal(h.requests.length, 0);
  h.fields.mobile.value = '+263 (77) 123-4567';
  h.events.input({ target: h.fields.mobile });
  await h.submit();
  assert.equal(h.requests.length, 1);
});

test('missing or unsafe configuration leaves email fallback and disables submission', async () => {
  for (const endpoint of ['', 'http://mail.example.test', 'undefined']) {
    const h = harness({ endpoint });
    await h.submit();
    assert.equal(h.requests.length, 0);
    assert.equal(h.button.disabled, true);
    assert.match(h.status.textContent, /email link/);
  }
});
