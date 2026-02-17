function firstHeaderValue(value: string | null) {
  if (!value) return null;
  const first = value.split(",")[0];
  return first ? first.trim() : null;
}

export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);

  // Respect reverse-proxy headers (Cloudflare Tunnel, Vercel, etc.) so redirects
  // don't accidentally emit internal origins like 0.0.0.0.
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));

  const protocol = forwardedProto ?? url.protocol.replace(":", "");
  const host = forwardedHost ?? request.headers.get("host") ?? url.host;

  return `${protocol}://${host}`;
}

export function absoluteUrl(request: Request, path: string) {
  return new URL(path, getRequestOrigin(request));
}
