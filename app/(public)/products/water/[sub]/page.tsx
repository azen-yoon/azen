import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { createStaticClient } from "@/lib/supabase/static";
import { ProductDetailBackButton } from "@/components/features/ProductDetailBackButton";
import {
  CATALOG_SUB_LABEL_FALLBACK,
  WATER_SUB_CARDS,
  resolveWaterSubSlug,
} from "@/lib/products-catalog";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 300;
export const preferredRegion = "icn1";

interface WaterSubPageProps {
  params: Promise<{ sub: string }>;
}

export async function generateMetadata({ params }: WaterSubPageProps): Promise<Metadata> {
  const { sub } = await params;
  const categorySlug = resolveWaterSubSlug(sub);

  if (!categorySlug) {
    return createPageMetadata({
      title: "수처리 필터",
      description: "수처리 필터 제품 목록",
      path: `/products/water/${sub}`,
      noIndex: true,
    });
  }

  const card = WATER_SUB_CARDS.find((item) => item.slug === categorySlug);
  const title = card?.label ?? CATALOG_SUB_LABEL_FALLBACK[categorySlug] ?? categorySlug;

  return createPageMetadata({
    title: `${title} 수처리 필터`,
    description: `AZEN ${title} 수처리 필터 제품 목록. DEPTH·CARBON·PLEATED 등 산업용 수처리 필터 라인업을 확인하세요.`,
    path: `/products/water/${sub}`,
  });
}

const crumbLinkClass =
  "text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline";

const pageContainer = "mx-auto w-full min-w-0 max-w-6xl px-4";

const getWaterSubProducts = (categorySlug: string) =>
  unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data: category, error: categoryError } = await supabase
        .from("azen_categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();

      if (categoryError) {
        return { products: [] as Array<{ id: string; name: string; description: string | null; thumbnail_url: string | null }>, categoryError, productsError: null as { message: string } | null };
      }

      if (!category) {
        return { products: [], categoryError: null, productsError: null };
      }

      const { data: products, error: productsError } = await supabase
        .from("azen_products")
        .select("id, name, description, thumbnail_url")
        .eq("is_published", true)
        .eq("category_id", category.id)
        .order("created_at", { ascending: true });

      return { products: products ?? [], categoryError: null, productsError };
    },
    ["water-sub-products", categorySlug],
    { revalidate: 60 },
  )();

export default async function WaterSubProductsPage({ params }: WaterSubPageProps) {
  const { sub } = await params;
  const categorySlug = resolveWaterSubSlug(sub);

  if (!categorySlug) {
    notFound();
  }

  const card = WATER_SUB_CARDS.find((item) => item.slug === categorySlug);
  const title = card?.label ?? CATALOG_SUB_LABEL_FALLBACK[categorySlug] ?? categorySlug;

  const { products, categoryError, productsError } = await getWaterSubProducts(categorySlug);

  if (categoryError) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-red-500">
        카테고리 정보를 불러오지 못했습니다.
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-red-500">
        제품을 불러오지 못했습니다: {productsError.message}
      </div>
    );
  }

  const productRows = products;

  return (
    <main className="w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <div className={`${pageContainer} pb-10 pt-12`}>
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <ProductDetailBackButton />
            <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-foreground">{title}</h1>
          </div>
          <nav
            aria-label="breadcrumb"
            className="min-w-0 pl-[calc(2.5rem+0.75rem)] pt-1 text-sm text-muted-foreground"
          >
            <span className="flex flex-wrap items-center gap-x-1 gap-y-1">
              <Link href="/products?category=filter" className={crumbLinkClass}>
                제품소개
              </Link>
              <span className="px-0.5 text-muted-foreground/60" aria-hidden>
                &gt;
              </span>
              <Link href="/products?category=water_treatment" className={crumbLinkClass}>
                {CATALOG_SUB_LABEL_FALLBACK.water_treatment}
              </Link>
              <span className="px-0.5 text-muted-foreground/60" aria-hidden>
                &gt;
              </span>
              <span className="font-medium text-foreground">{title}</span>
            </span>
          </nav>
          <hr className="mt-6 border-border dark:border-white/20" aria-hidden />
        </div>
      </div>

      <section className={`${pageContainer} pb-16 pt-8`}>
        {productRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-elevated px-6 py-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="font-medium text-foreground">등록된 제품이 없습니다.</p>
          </div>
        ) : (
          <div>
            {productRows.map((product, index) => (
              <div
                key={product.id}
                className={`flex min-w-0 flex-col gap-6 py-8 lg:flex-row lg:items-start ${
                  index < productRows.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="relative flex h-60 w-full max-w-xs shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-muted">
                  {product.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden break-words">
                  <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
                  {product.description ? (
                    <div
                      className="mt-2 text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
