import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { createStaticClient } from "@/lib/supabase/static";

export const SITE_NAME = "AZEN";
export const OG_IMAGE_PATH = "/logo.png";

export const DEFAULT_DESCRIPTION =
  "멈추지 않는 공정, 빈틈없는 필터 케어 솔루션. 공조·집진·수처리 필터부터 전기·유공압 부품까지 산업용 필터 전문 기업 AZEN.";

export const DEFAULT_KEYWORDS = [
  "AZEN",
  "에이젠",
  "산업용 필터",
  "공업용 필터",
  "공조기 필터",
  "집진기 필터",
  "수처리 필터",
  "전기 부품",
  "유공압",
  "필터 교체",
  "구매대행",
];

export const getSiteUrl = (): string => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
};

export const absoluteUrl = (path: string): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
};

export const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type CreatePageMetadataOptions = {
  title: string;
  description?: string;
  keywords?: string[];
  path: string;
  ogImage?: string | null;
  noIndex?: boolean;
};

export const createPageMetadata = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  path,
  ogImage,
  noIndex = false,
}: CreatePageMetadataOptions): Metadata => {
  const url = absoluteUrl(path);
  const ogTitle = `${title} | ${SITE_NAME}`;
  const imageUrl = ogImage?.trim() || OG_IMAGE_PATH;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: imageUrl,
          alt: ogTitle,
        },
      ],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
};

export const getProductForSeo = (id: string) =>
  unstable_cache(
    async () => {
      const supabase = createStaticClient();
      const { data } = await supabase
        .from("azen_products")
        .select("id, name, description, thumbnail_url, updated_at")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();

      return data;
    },
    ["product-seo", id],
    { revalidate: 300 },
  )();

export const getPublishedProductsForSitemap = () =>
  unstable_cache(
    async () => {
      const supabase = createStaticClient();
      const { data } = await supabase
        .from("azen_products")
        .select("id, updated_at")
        .eq("is_published", true);

      return data ?? [];
    },
    ["sitemap-products"],
    { revalidate: 300 },
  )();
