import { Suspense } from "react";
import type { Metadata } from "next";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { ConditionalHeader } from "@/components/layout/ConditionalHeader";
import { ThemeClassBridge } from "@/components/layout/ThemeClassBridge";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  getSiteUrl,
  SITE_NAME,
} from "@/lib/seo";
import "./globals.css";
import "./prose.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} | 산업용 필터 솔루션`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 산업용 필터 솔루션`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "https://www.a-zen.co.kr/logo.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  verification: {
    google: "a7pf7uczinpPsIfvCeOwHJOLzMqoATXycVIj2EUwTEA",
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
