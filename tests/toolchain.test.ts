import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const fromFirebase = createRequire(import.meta.resolve('firebase-tools'));
const fromGaxios = createRequire(fromFirebase.resolve('gaxios'));
const uuid = fromGaxios('uuid');

test('Firebase transport loads patched uuid through CommonJS', () => {
  assert.equal(fromGaxios('uuid/package.json').version, '11.1.1');
  assert.equal(uuid.validate(uuid.v4()), true);
  for (const generate of [uuid.v3, uuid.v5]) {
    assert.throws(() => generate('test', uuid.v3.DNS, new Uint8Array(15)), RangeError);
  }
  assert.throws(() => uuid.v6({}, new Uint8Array(15)), RangeError);
});

test('Firebase gaxios transport generates a valid multipart request with patched uuid', async () => {
  const { Gaxios } = fromFirebase('gaxios');
  const response = await new Gaxios().request({
    url: 'https://example.invalid/upload',
    method: 'POST',
    multipart: [{ headers: { 'Content-Type': 'text/plain' }, content: 'transport-check' }],
    // Exercise real request serialization without sending data or requiring credentials.
    adapter: async (options: any) => {
      const chunks: Buffer[] = [];
      for await (const chunk of options.body) chunks.push(Buffer.from(chunk));
      return {
        config: options,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          contentType: options.headers['Content-Type'],
          body: Buffer.concat(chunks).toString(),
        },
      };
    },
  });
  const boundary = response.data.contentType.split('boundary=')[1];
  assert.equal(uuid.validate(boundary), true);
  assert.match(response.data.body, /Content-Type: text\/plain\r\n\r\ntransport-check/);
  assert.ok(response.data.body.endsWith(`--${boundary}--`));
});
