import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { ClipboardList, ListChecks } from "lucide-react";
import { createStaticClient } from "@/lib/supabase/static";
import { getCatalogBreadcrumbLabel, WATER_SUB_SLUGS } from "@/lib/products-catalog";
import { ProductDetailBackButton } from "@/components/features/ProductDetailBackButton";
import { ProductDetailHtmlContent } from "@/components/features/ProductDetailHtmlContent";
import { ProductGallery } from "@/components/features/ProductGallery";
import { createPageMetadata, getProductForSeo, stripHtml } from "@/lib/seo";

export const revalidate = 300;

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForSeo(id);

  if (!product) {
    return createPageMetadata({
      title: "제품을 찾을 수 없습니다",
      description: "요청하신 제품 정보를 찾을 수 없습니다.",
      path: `/products/${id}`,
      noIndex: true,
    });
  }

  const description = product.description
    ? stripHtml(product.description).slice(0, 160)
    : `${product.name} 제품 상세 정보를 AZEN에서 확인하세요.`;

  return createPageMetadata({
    title: product.name,
    description,
    path: `/products/${product.id}`,
    ogImage: product.thumbnail_url,
  });
}

interface CategoryRow {
  name: string;
  slug: string;
  parent_id: string | null;
}

interface ProductSpecItem {
  title: string;
  content: string;
}

const normalizeCategory = (cat: unknown): CategoryRow | null => {
  const parse = (o: object): CategoryRow | null => {
    if (!("name" in o) || !("slug" in o)) return null;
    const pid = (o as { parent_id?: unknown }).parent_id;
    return {
      name: String((o as { name: unknown }).name),
      slug: String((o as { slug: unknown }).slug),
      parent_id: pid == null ? null : String(pid),
    };
  };
  if (cat == null) return null;
  if (Array.isArray(cat)) return cat[0] && typeof cat[0] === "object" ? parse(cat[0] as object) : null;
  if (typeof cat === "object") return parse(cat as object);
  return null;
};

const buildGalleryUrls = (
  thumbnailUrl: string | null,
  rows: Array<{ id: string; url: string; sort_order: number }> | null,
): string[] => {
  const ordered = [...(rows ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const seen = new Set<string>();
  const urls: string[] = [];
  const push = (u: string | null | undefined) => {
    const s = u?.trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    urls.push(s);
  };
  push(thumbnailUrl);
  for (const row of ordered) push(row.url);
  return urls;
};

const parseSpecItems = (value: unknown): ProductSpecItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as { title?: unknown; content?: unknown };
      const title = typeof record.title === "string" ? record.title.trim() : "";
      const content = typeof record.content === "string" ? record.content.trim() : "";

      if (!title && !content) {
        return null;
      }

      return { title, content };
    })
    .filter((item): item is ProductSpecItem => item !== null)
    .slice(0, 6);
};

const crumbLinkClass =
  "text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline";

/** Header.tsx와 동일: `max-w-6xl` + `px-4` */
const pageContainer = "mx-auto w-full min-w-0 max-w-6xl px-4";

const getProductDetail = (id: string) =>
  unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase
        .from("azen_products")
        .select(
          `id, name, description, content, content_overview, content_technology, content_application, spec, spec_items, thumbnail_url,
       category:azen_categories(name, slug, parent_id),
       images:azen_product_images(id, url, sort_order)`,
        )
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        return { data: null, error, parentCategory: null as { name: string; slug: string } | null };
      }

      const category = normalizeCategory(data.category);

      let parentCategory: { name: string; slug: string } | null = null;
      if (category?.parent_id) {
        const { data: parentRow } = await supabase
          .from("azen_categories")
          .select("name, slug")
          .eq("id", category.parent_id)
          .maybeSingle();
        if (parentRow && typeof parentRow.name === "string" && typeof parentRow.slug === "string") {
          parentCategory = { name: parentRow.name, slug: parentRow.slug };
        }
      }

      return { data, error: null, parentCategory };
    },
    ["product-detail", id],
    { revalidate: 60 },
  )();

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const { data, error, parentCategory } = await getProductDetail(id);

  if (error || !data) notFound();

  const category = normalizeCategory(data.category);
  const galleryUrls = buildGalleryUrls(
    (data.thumbnail_url ?? null) as string | null,
    (data.images ?? null) as Array<{ id: string; url: string; sort_order: number }> | null,
  );

  const name = data.name as string;
  const description = (data.description ?? null) as string | null;
  const contentOverview = (data.content_overview ?? null) as string | null;
  const contentTechnology = (data.content_technology ?? null) as string | null;
  const contentApplication = (data.content_application ?? null) as string | null;
  const spec = (data.spec ?? null) as string | null;
  const specItems = parseSpecItems(data.spec_items);
  const isWaterSubProduct = category
    ? (WATER_SUB_SLUGS as readonly string[]).includes(category.slug)
    : false;
  const categoryListHref = isWaterSubProduct
    ? "/products?category=water_treatment"
    : category
      ? `/products?category=${encodeURIComponent(category.slug)}`
      : null;
  const hasContentSections = Boolean(contentOverview || contentTechnology || contentApplication);

  return (
    <main className="w-full min-w-0 overflow-x-hidden">
      {/* 1–2. 타이틀 + 브레드크럼 (GNB와 동일 너비·뒤로 버튼 열 제외하고 제품명·브레드크럼 시작선 정렬) */}
      <div className={`${pageContainer} pb-10 pt-12`}>
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <ProductDetailBackButton />
            <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-foreground">{name}</h1>
          </div>
          <nav
            aria-label="breadcrumb"
            className="min-w-0 pl-[calc(2.5rem+0.75rem)] pt-1 text-sm text-muted-foreground"
          >
            {category ? (
              <span className="flex flex-wrap items-center gap-x-1 gap-y-1">
                {parentCategory ? (
                  <>
                    <Link
                      href={`/products?category=${encodeURIComponent(parentCategory.slug)}`}
                      className={crumbLinkClass}
                    >
                      {getCatalogBreadcrumbLabel(parentCategory.slug, parentCategory.name)}
                    </Link>
                    <span className="px-0.5 text-muted-foreground/60" aria-hidden>&gt;</span>
                    <Link
                      href={categoryListHref ?? "#"}
                      className={crumbLinkClass}
                    >
                      {category.name}
                    </Link>
                    <span className="px-0.5 text-muted-foreground/60" aria-hidden>&gt;</span>
                  </>
                ) : (
                  <>
                    <Link
                      href={categoryListHref ?? "#"}
                      className={crumbLinkClass}
                    >
                      {category.name}
                    </Link>
                    <span className="px-0.5 text-muted-foreground/60" aria-hidden>&gt;</span>
                  </>
                )}
                <span className="font-medium text-foreground">{name}</span>
              </span>
            ) : (
              <span className="font-medium text-foreground">{name}</span>
            )}
          </nav>
          <hr className="mt-6 border-border dark:border-white/20" aria-hidden />
        </div>
      </div>

      {/* 3. 좌우 분할 */}
      <div className={`${pageContainer} pb-16 pt-8`}>
        <div className="grid min-w-0 grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0 max-w-full">
            <ProductGallery urls={galleryUrls} productName={name} />
          </div>

          <div className="flex min-w-0 max-w-full flex-col break-words">
            {category ? <p className="text-sm text-primary">{category.name}</p> : null}
            <h2 className="mt-1 text-2xl font-bold text-foreground">{name}</h2>
            {description ? (
              <div
                className="mt-2 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : null}
            {!isWaterSubProduct && (specItems.length > 0 || spec) ? (
              <>
                <hr className="my-4 border-border dark:border-white/20" />
                <p className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
                  <ListChecks className="h-5 w-5 text-foreground" aria-hidden />
                  스펙
                </p>
                {specItems.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {specItems.map((item, index) => (
                      <div
                        key={`${item.title}-${index}`}
                        className={
                          index % 4 === 0 || index % 4 === 3
                            ? "rounded-xl border border-border bg-blue-50 p-4 transition-all duration-200 dark:bg-blue-950/30 md:hover:-translate-y-1 md:hover:border-primary md:hover:shadow-md"
                            : "rounded-xl border border-border bg-slate-50 p-4 transition-all duration-200 dark:bg-slate-800/30 md:hover:-translate-y-1 md:hover:border-primary md:hover:shadow-md"
                        }
                      >
                        <p className="border-l-2 border-primary pl-3 text-sm font-semibold text-foreground">
                          {item.title || "스펙"}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.content || "-"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ProductDetailHtmlContent
                    html={spec ?? ""}
                    className="prose prose-slate dark:prose-invert mt-2 min-w-0 max-w-none overflow-x-auto break-words text-sm leading-relaxed text-foreground [&_a]:text-primary [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_li]:mb-1 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* 4. 하단 상세설명 */}
      {!isWaterSubProduct &&
        (hasContentSections ? (
        <div className={`${pageContainer} pb-16 pt-12`}>
          <div className="space-y-8">
            {contentOverview ? (
              <section className="space-y-4 pt-8 first:pt-0">
                <h3 className="mb-4 border-b-2 border-foreground pb-2 text-xl font-bold text-foreground">
                  제품 개요
                </h3>
                <ProductDetailHtmlContent
                  html={contentOverview}
                  className="prose prose-slate dark:prose-invert min-w-0 max-w-none overflow-x-auto break-words text-sm leading-relaxed text-foreground md:text-base [&_a]:text-primary [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                />
              </section>
            ) : null}
            {contentTechnology ? (
              <section className="space-y-4 pt-8 first:pt-0">
                <h3 className="mb-4 border-b-2 border-foreground pb-2 text-xl font-bold text-foreground">
                  핵심 기술 및 특장점
                </h3>
                <ProductDetailHtmlContent
                  html={contentTechnology}
                  className="prose prose-slate dark:prose-invert min-w-0 max-w-none overflow-x-auto break-words text-sm leading-relaxed text-foreground md:text-base [&_a]:text-primary [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                />
              </section>
            ) : null}
            {contentApplication ? (
              <section className="space-y-4 pt-8 first:pt-0">
                <h3 className="mb-4 border-b-2 border-foreground pb-2 text-xl font-bold text-foreground">
                  주요 적용 공정
                </h3>
                <ProductDetailHtmlContent
                  html={contentApplication}
                  className="prose prose-slate dark:prose-invert min-w-0 max-w-none overflow-x-auto break-words text-sm leading-relaxed text-foreground md:text-base [&_a]:text-primary [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                />
              </section>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={`${pageContainer} pb-16 pt-12`}>
          <div className="flex flex-col items-center gap-3 rounded-xl bg-muted py-24 text-center">
            <ClipboardList className="h-16 w-16 text-muted-foreground" aria-hidden />
            <p className="text-muted-foreground">상세 정보가 준비 중입니다.</p>
            <p className="text-sm text-muted-foreground">제품 정보는 순차적으로 업데이트됩니다.</p>
          </div>
        </div>
      ))}

    </main>
  );
}
