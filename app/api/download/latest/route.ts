import { NextResponse } from "next/server";

import { normalizeDownloadPlatform, resolveLatestDownload } from "@/lib/downloads";
import { absoluteUrl } from "@/lib/http/request-url";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  const platform = normalizeDownloadPlatform(
    url.searchParams.get("platform"),
    req.headers.get("user-agent"),
  );
  const match = resolveLatestDownload(platform);

  if (!match) {
    return NextResponse.json(
      {
        code: "not_available",
        message: "Desktop build not uploaded yet.",
        platform,
      },
      { status: 404 },
    );
  }

  if (format === "json") {
    return NextResponse.json({
      ok: true,
      platform,
      file: match.file,
      label: match.label,
      url: match.url,
    });
  }

  // Use a forwarded-host aware absolute URL so tunnels/proxies don't emit internal origins in Location headers.
  return NextResponse.redirect(absoluteUrl(req, match.url), 302);
}
