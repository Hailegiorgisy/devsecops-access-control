function canAccessOrder(user, order) {
  if (!user || !order) return false;

  // Administrators have chain-wide read visibility[cite: 1]
  if (user.role === "admin") {
    return true;
  }

  // Non-admin staff may only access orders belonging to their own branch[cite: 1]
  if (!user.branchId || !order.branchId) {
    return false;
  }

  return user.branchId === order.branchId;
}

module.exports = { canAccessOrder };