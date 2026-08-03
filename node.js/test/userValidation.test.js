const test = require('node:test');
const assert = require('node:assert/strict');

const { validateUserPayload } = require('../utils/userValidation');

test('rejects create/edit payloads without permissions', () => {
  const result = validateUserPayload({
    username: 'novo-user',
    password: '123456',
    role: 'user',
    status: 'active',
    permissions: []
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /pelo menos uma permissão/i);
});

test('accepts payloads when at least one permission is selected', () => {
  const result = validateUserPayload({
    username: 'novo-user',
    password: '123456',
    role: 'user',
    status: 'active',
    permissions: [1]
  });

  assert.equal(result.valid, true);
  assert.equal(result.error, null);
});
