let validated = false;

function isBlank(value: string | undefined | null) {
  return !value || value.trim().length === 0;
}

function isLocalhostUrl(raw: string) {
  try {
    const url = new URL(raw);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function assertServerEnv() {
  if (validated) return;
  validated = true;

  const missing: string[] = [];
  const requiredAlways = ["DATABASE_URL", "NEXTAUTH_URL", "AUTH_ENCRYPTION_KEY"] as const;
  for (const key of requiredAlways) {
    if (isBlank(process.env[key])) {
      missing.push(key);
    }
  }

  if (isBlank(process.env.NEXTAUTH_SECRET) && isBlank(process.env.AUTH_SECRET)) {
    missing.push("NEXTAUTH_SECRET (or AUTH_SECRET)");
  }

  const isProd = process.env.NODE_ENV === "production";
  const isProductionBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  if (isProd) {
    if (isBlank(process.env.OWNER_EMAIL)) {
      missing.push("OWNER_EMAIL");
    }
    if (isBlank(process.env.OWNER_BOOTSTRAP_PASSWORD)) {
      missing.push("OWNER_BOOTSTRAP_PASSWORD");
    }
    if (
      !isBlank(process.env.NEXTAUTH_URL) &&
      !String(process.env.NEXTAUTH_URL).startsWith("https://") &&
      !isLocalhostUrl(String(process.env.NEXTAUTH_URL))
    ) {
      throw new Error(
        "NEXTAUTH_URL must use https:// in production (localhost is allowed for local testing).",
      );
    }

    const bypassEnabled = process.env.AUTH_BYPASS === "true" || process.env.AUTH_BYPASS === "1";
    const bypassUnsafe =
      process.env.AUTH_BYPASS_UNSAFE === "true" || process.env.AUTH_BYPASS_UNSAFE === "1";
    if (bypassEnabled || bypassUnsafe) {
      if (isProductionBuildPhase) {
        console.warn(
          "[env] AUTH_BYPASS/AUTH_BYPASS_UNSAFE are enabled while building for production. Disable before deploying.",
        );
      } else {
        throw new Error("AUTH_BYPASS/AUTH_BYPASS_UNSAFE are not allowed in production.");
      }
    }
  } else {
    if (isBlank(process.env.OWNER_EMAIL)) {
      console.warn(
        "[env] OWNER_EMAIL is not set. Bootstrap will fall back to default owner email.",
      );
    }
    if (isBlank(process.env.OWNER_BOOTSTRAP_PASSWORD)) {
      console.warn(
        "[env] OWNER_BOOTSTRAP_PASSWORD is not set. Development bootstrap may generate a one-time password.",
      );
    }
  }

  if (missing.length > 0) {
    if (isProd && isProductionBuildPhase) {
      console.warn(
        `[env] Missing required environment variables for production runtime: ${missing.join(", ")}`,
      );
      return;
    }
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
