// Where each role lands right after login/verification. Extend this as
// contractor/worker/shop portals are added in later phases.
const ROLE_HOME = {
  customer: '/dashboard',
  supervisor: '/supervisor',
}

export function roleHome(role) {
  return ROLE_HOME[role] || '/dashboard'
}
