// Requirement 3.4: Permissions Table 
const ROLE_PERMISSIONS = Object.freeze({
  waiter: ["orders:create", "orders:read"],
  cashier: ["orders:read", "payments:create"],
  manager: ["orders:read", "reports:read"],
  admin: ["users:manage", "orders:read", "reports:read"],
});

function getPermissionsForRole(role) {
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role)) {
    return []; // Unknown role receives no permissions (deny by default)[cite: 1, 2]
  }
  return ROLE_PERMISSIONS[role];
}

function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  return getPermissionsForRole(user.role).includes(permission);
}

module.exports = {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
};