function normalizePermissionIds(permissions = []) {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return permissions
    .map(permission => {
      if (permission && typeof permission === 'object') {
        return permission.id ?? permission.permission_id ?? permission.permissionId;
      }

      return permission;
    })
    .filter(permissionId => permissionId !== undefined && permissionId !== null && permissionId !== '')
    .map(permissionId => Number(permissionId))
    .filter(permissionId => Number.isFinite(permissionId) && permissionId > 0);
}

function validateUserPayload(payload = {}) {
  const permissions = normalizePermissionIds(Array.isArray(payload.permissions) ? payload.permissions : []);

  const hasPermission = permissions.length > 0;

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
  normalizePermissionIds,
  validateUserPayload
};
