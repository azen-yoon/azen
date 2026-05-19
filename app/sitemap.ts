import type { MetadataRoute } from "next";
import {
  ELECTRIC_SUB_SLUGS,
  FILTER_SUB_SLUGS,
  WATER_SUB_CARDS,
} from "@/lib/products-catalog";
import { absoluteUrl, getPublishedProductsForSitemap } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/purchase"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/service"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const catalogRoutes: MetadataRoute.Sitemap = [
    ...FILTER_SUB_SLUGS,
    ...ELECTRIC_SUB_SLUGS,
  ].map((slug) => ({
    url: absoluteUrl(`/products?category=${encodeURIComponent(slug)}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: slug === "air_handling" ? 0.9 : 0.8,
  }));

  const waterRoutes: MetadataRoute.Sitemap = WATER_SUB_CARDS.map((card) => ({
    url: absoluteUrl(`/products/water/${card.path}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const products = await getPublishedProductsForSitemap();
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/products/${product.id}`),
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...catalogRoutes, ...waterRoutes, ...productRoutes];
}
