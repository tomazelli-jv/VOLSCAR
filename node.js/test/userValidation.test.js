const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizePermissionIds, validateUserPayload } = require('../utils/userValidation');

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

test('normalizes permission payloads from objects and arrays', () => {
  const normalized = normalizePermissionIds([{ id: 2 }, { permission_id: 4 }, 7]);

  assert.deepEqual(normalized, [2, 4, 7]);
});
