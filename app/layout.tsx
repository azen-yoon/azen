import { Suspense } from "react";
import type { Metadata } from "next";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { ConditionalHeader } from "@/components/layout/ConditionalHeader";
import { ThemeClassBridge } from "@/components/layout/ThemeClassBridge";
import {
  buildOpenGraph,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";
import "./prose.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  openGraph: buildOpenGraph({
    title: SITE_TITLE,
    url: SITE_URL,
  }),
  verification: {
    google: "a7pf7uczinpPsIfvCeOwHJOLzMqoATXycVIj2EUwTEA",
    other: {
      "naver-site-verification": "22fe96bb9cb21ef9355c657d06ad064e2ce8f188",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="light h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <ThemeClassBridge />
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={null}>
            <ConditionalHeader />
          </Suspense>
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
        </div>
      </body>
    </html>
  );
}
