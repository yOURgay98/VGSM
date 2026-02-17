import type { NextConfig } from "next";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)));

const isDev = process.env.NODE_ENV !== "production";
const enableProdBrowserSourceMaps = process.env.ENABLE_PROD_BROWSER_SOURCEMAPS === "true";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // MapLibre raster tiles and screenshots.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // HMR uses ws: in dev, and some deployments use wss:.
  "connect-src 'self' https: wss: ws:",
  "worker-src 'self' blob:",
  // Reference map mode embeds ERLC Hub in an iframe.
  "frame-src 'self' https://erlc-hub.pages.dev",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Default: don't ship browser source maps for release builds. Allow opt-in for staging/debug.
  productionBrowserSourceMaps: enableProdBrowserSourceMaps,
  compiler: isDev
    ? undefined
    : {
        // Keep warn/error logs in prod; strip noisy console.* from bundles.
        removeConsole: { exclude: ["error", "warn"] },
      },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: csp },
          ...(isDev
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]),
        ],
      },
    ];
  },
};

export default nextConfig;
