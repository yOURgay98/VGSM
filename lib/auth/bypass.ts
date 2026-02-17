export function isAuthBypassEnabled() {
  if (process.env.NODE_ENV === "production") return false;
  const enabled = process.env.AUTH_BYPASS === "true" || process.env.AUTH_BYPASS === "1";
  const unsafeAllowed =
    process.env.AUTH_BYPASS_UNSAFE === "true" || process.env.AUTH_BYPASS_UNSAFE === "1";
  return enabled && unsafeAllowed;
}
