import type { MetadataRoute } from "next";
import {
  ELECTRIC_SUB_SLUGS,
  FILTER_SUB_SLUGS,
  WATER_SUB_CARDS,
} from "@/lib/products-catalog";
import { getPublishedProductsForSitemap } from "@/lib/seo";

const SITE_URL = "https://www.a-zen.co.kr";

const sitemapUrl = (path: string): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: sitemapUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: sitemapUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: sitemapUrl("/purchase"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: sitemapUrl("/service"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const catalogRoutes: MetadataRoute.Sitemap = [
    ...FILTER_SUB_SLUGS,
    ...ELECTRIC_SUB_SLUGS,
  ].map((slug) => ({
    url: sitemapUrl(`/products?category=${encodeURIComponent(slug)}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: slug === "air_handling" ? 0.9 : 0.8,
  }));

  const waterRoutes: MetadataRoute.Sitemap = WATER_SUB_CARDS.map((card) => ({
    url: sitemapUrl(`/products/water/${card.path}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const products = await getPublishedProductsForSitemap();
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: sitemapUrl(`/products/${product.id}`),
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...catalogRoutes, ...waterRoutes, ...productRoutes];
}
