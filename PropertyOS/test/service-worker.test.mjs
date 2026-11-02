import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

function worker() {
  const events = {}, deleted = [];
  const context = {
    URL, Promise, Set, setTimeout: () => 0, fetch: async () => { throw new Error('offline'); },
    Response: { error: () => 'network-error' }, location: { origin: 'https://property.test' },
    self: {
      registration: { scope: 'https://property.test/' },
      clients: { claim() {} },
      addEventListener: (name, handler) => { events[name] = handler; },
    },
    caches: {
      match: async () => { assert.fail('Global cache lookup must not be used'); },
      open: async name => {
        assert.equal(name, 'propertyos-test');
        return { match: async () => 'cached-shell' };
      },
      keys: async () => ['propertyos-old', 'propertyos-test', 'another-app'],
      delete: async key => deleted.push(key),
    },
  };
  const source = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8')
    .replace("'__CACHE_NAME__'", "'propertyos-test'")
    .replace('/*__PRECACHE__*/[]', '["./", "index.html", "build/app.js"]');
  vm.runInNewContext(source, context);
  return { events, deleted };
}

test('worker does not intercept API, external, or non-GET requests', () => {
  const { events } = worker();
  for (const [url, method] of [
    ['https://property.test/api/receipt', 'GET'],
    ['https://property.test/private.json', 'GET'],
    ['https://external.test/build/app.js', 'GET'],
    ['https://property.test/index.html', 'POST'],
  ]) {
    events.fetch({ request: { url, method }, respondWith() { assert.fail('Sensitive request intercepted'); } });
  }
});

test('activation removes only obsolete PropertyOS caches', async () => {
  const { events, deleted } = worker();
  let completion;
  events.activate({ waitUntil(promise) { completion = promise; } });
  await completion;
  assert.deepEqual(deleted, ['propertyos-old']);
});


test('offline navigation uses cached shell when navigation preload rejects', async () => {
  const { events } = worker();
  let response;
  events.fetch({
    request: { url: 'https://property.test/', method: 'GET', mode: 'navigate' },
    preloadResponse: Promise.reject(new Error('offline preload')),
    respondWith(promise) { response = promise; },
  });
  assert.equal(await response, 'cached-shell');
});
