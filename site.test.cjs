const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

function run(file, hash = '', search = '') {
  const nodes = new Map();
  const timers = new Map();
  const events = {};
  let sequence = 0;
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      hidden: false, textContent: '', value: '', events: {},
      addEventListener(type, callback) { this.events[type] = callback; },
      removeAttribute(name) { delete this[name]; },
      focus() {}, select() {}
    });
    return nodes.get(id);
  };
  const location = { hash, search, replace(url) { this.redirect = url; } };
  const navigator = { clipboard: { async writeText(value) { navigator.copied = value; } } };
  const context = { URL, URLSearchParams, location, navigator,
    document: { getElementById: node, querySelectorAll: () => [] },
    window: { addEventListener: (type, callback) => { events[type] = callback; } },
    setTimeout: callback => { timers.set(++sequence, callback); return sequence; },
    clearTimeout: id => timers.delete(id)
  };
  vm.runInNewContext(readFileSync(join(__dirname, file), 'utf8'), context);
  return { node, location, navigator, events, timers };
}

test('numeric referral redirects, invalid referrals do not', () => {
  for (const value of ['1', '00123', '12345678901234567890']) {
    const app = run('site.js', '', '?invite=' + value);
    assert.equal(app.node('go').href, 'https://t.me/taikovpnbot?start=ref_' + value);
    [...app.timers.values()][0]();
    assert.equal(app.location.redirect, app.node('go').href);
  }
  for (const value of ['', '-1', '1e2', '123456789012345678901', '%3Cscript%3E']) {
    assert.equal(run('site.js', '', '?invite=' + value).timers.size, 0);
  }
});

test('raw and encoded URLs retain escaped tokens and open Happ', () => {
  const url = 'https://vpn.test/a%2Fb?token=a%3Fb&x=2';
  for (const hash of ['#' + url, '#' + encodeURIComponent(url)]) {
    const app = run('connect.js', hash);
    assert.equal(app.node('open').href, 'happ://add/' + url);
    assert.equal(app.node('open').hidden, false);
    [...app.timers.values()][0]();
    assert.equal(app.location.href, 'happ://add/' + url);
  }
});

test('missing, malformed, unsafe and demo links never import', () => {
  for (const value of ['', '%E0%A4%A', 'javascript:alert(1)', 'https://', 'https://user:pass@vpn.test/x', 'https://vpn.test/a b', 'https://vpn.test/%zz', 'https://example.com/demo', 'https://sub.example.com/demo', 'https://EXAMPLE.com./demo']) {
    const app = run('connect.js', '#' + value);
    assert.equal(app.node('open').hidden, true, value);
    assert.equal(app.node('copy').hidden, true, value);
    assert.equal(app.timers.size, 0, value);
  }
});

test('copy success, permission fallback and hash reset', async () => {
  const app = run('connect.js', '#https://vpn.test/demo');
  await app.node('copy').events.click();
  assert.equal(app.navigator.copied, 'https://vpn.test/demo');
  assert.equal(app.timers.size, 0);
  app.navigator.clipboard.writeText = async () => { throw new Error('denied'); };
  await app.node('copy').events.click();
  assert.equal(app.node('manual-copy').hidden, false);
  assert.equal(app.node('subscription').value, 'https://vpn.test/demo');
  app.location.hash = '#invalid';
  app.events.hashchange();
  assert.equal(app.node('subscription').value, '');
  assert.equal(app.node('manual-copy').hidden, true);
  assert.equal(app.node('open').href, undefined);
});
