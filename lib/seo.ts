import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { createStaticClient } from "@/lib/supabase/static";

export const SITE_NAME = "AZEN";
export const SITE_URL = "https://www.a-zen.co.kr";
export const OG_IMAGE_PATH = "/og-image.png";
export const DEFAULT_OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE_PATH}`;

export const SITE_DESCRIPTION =
  "멈추지 않는 공정, 빈틈없는 필터 케어 솔루션. AZEN이 책임집니다.";

export const DEFAULT_DESCRIPTION = SITE_DESCRIPTION;
export const DEFAULT_OG_DESCRIPTION = SITE_DESCRIPTION;

export const DEFAULT_OG_IMAGES = [
  {
    url: DEFAULT_OG_IMAGE_URL,
    width: 1200,
    height: 630,
    alt: SITE_NAME,
  },
] as const;

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

export const getSiteUrl = (): string => SITE_URL;

export const absoluteUrl = (path: string): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
};

export const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type BuildOpenGraphOptions = {
  title: string;
  url?: string;
  description?: string;
  ogImage?: string | null;
};

/** Kakao·Facebook 등 크롤러용 — og 필드 누락 방지 */
export const buildOpenGraph = ({
  title,
  url = SITE_URL,
  description = DEFAULT_OG_DESCRIPTION,
  ogImage,
}: BuildOpenGraphOptions): NonNullable<Metadata["openGraph"]> => ({
  type: "website",
  url,
  siteName: SITE_NAME,
  title,
  description,
  locale: "ko_KR",
  images: [
    {
      url: ogImage?.trim() || DEFAULT_OG_IMAGE_URL,
      width: 1200,
      height: 630,
      alt: title,
    },
  ],
});

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
  const imageUrl = ogImage?.trim() || DEFAULT_OG_IMAGE_URL;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: buildOpenGraph({
      title: ogTitle,
      url,
      description: DEFAULT_OG_DESCRIPTION,
      ogImage: imageUrl,
    }),
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
