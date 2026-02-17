import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { assertServerEnv } from "@/lib/env/validate";

import "./globals.css";

assertServerEnv();

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vanguard Security & Management",
  description: "Security-first moderation and dispatch console for operational teams",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("erlc_theme")?.value;
  const initialTheme = cookieTheme === "dark" || cookieTheme === "gray" ? cookieTheme : "light";

  const cookieAccent = cookieStore.get("erlc_accent")?.value;
  const cookieAccentCustom = cookieStore.get("erlc_accent_custom")?.value;
  const initialAccent =
    cookieAccent === "teal" || cookieAccent === "graphite" || cookieAccent === "custom"
      ? cookieAccent
      : "blue";
  const normalizedCustomAccent =
    cookieAccentCustom && /^#?[0-9a-fA-F]{6}$/.test(cookieAccentCustom.trim())
      ? cookieAccentCustom.trim().startsWith("#")
        ? cookieAccentCustom.trim().toLowerCase()
        : `#${cookieAccentCustom.trim().toLowerCase()}`
      : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={initialTheme}
      data-accent={initialAccent}
      style={
        initialAccent === "custom" && normalizedCustomAccent
          ? ({ "--accent": normalizedCustomAccent } as React.CSSProperties)
          : undefined
      }
    >
      <body className={`${manrope.variable} font-sans antialiased`}>
        <ThemeProvider
          initialTheme={initialTheme}
          initialAccent={initialAccent}
          initialCustomAccent={normalizedCustomAccent}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
