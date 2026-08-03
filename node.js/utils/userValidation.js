function validateUserPayload(payload = {}) {
  const permissions = Array.isArray(payload.permissions)
    ? payload.permissions
    : [];

  const hasPermission = permissions.some(permission => {
    const permissionId = typeof permission === 'object' ? permission.id : permission;
    return Number(permissionId) > 0;
  });

  if (!hasPermission) {
    return {
      valid: false,
      error: 'Selecione pelo menos uma permissão antes de salvar.'
    };
  }

  return {
    valid: true,
    error: null
  };
}

module.exports = {
  validateUserPayload
};
