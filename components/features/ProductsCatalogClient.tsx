"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CATALOG_SUB_LABEL_FALLBACK,
  ELECTRIC_SUB_SLUGS,
  FILTER_SUB_SLUGS,
  WATER_SUB_CARDS,
  type ProductCatalogGroup,
} from "@/lib/products-catalog";
import { ProductCard, type ProductCardDisplay } from "@/components/features/ProductCard";
import { ChevronDown, Package } from "lucide-react";

export interface CatalogProduct extends ProductCardDisplay {
  categorySlug: string;
}

interface CategoryChip {
  slug: string;
  name: string;
}

interface ProductsCatalogClientProps {
  products: CatalogProduct[];
  group: ProductCatalogGroup;
  urlCategorySlug: string;
  categoryChips: CategoryChip[];
}

const FILTER_TABS = FILTER_SUB_SLUGS.map((slug) => ({
  slug,
  label: CATALOG_SUB_LABEL_FALLBACK[slug] ?? slug,
}));

const initialSelectedSub = (urlSlug: string, group: ProductCatalogGroup): "all" | string => {
  const subSlugs: readonly string[] = group === "filter" ? FILTER_SUB_SLUGS : ELECTRIC_SUB_SLUGS;
  return subSlugs.includes(urlSlug) ? urlSlug : "all";
};

export const ProductsCatalogClient = ({
  products,
  group,
  urlCategorySlug,
  categoryChips,
}: ProductsCatalogClientProps) => {
  const [search, setSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState<"all" | string>(() =>
    initialSelectedSub(urlCategorySlug, group),
  );

  useEffect(() => {
    setSelectedSub(initialSelectedSub(urlCategorySlug, group));
  }, [urlCategorySlug, group]);

  const filterTabProducts = useMemo(() => {
    if (group !== "filter" || urlCategorySlug === "water_treatment") return [];
    return products.filter((p) => p.categorySlug === urlCategorySlug);
  }, [products, group, urlCategorySlug]);

  const waterSubThumbnailBySlug = useMemo(() => {
    const thumbnails: Record<string, string | null> = {};

    for (const card of WATER_SUB_CARDS) {
      const firstProduct = products.find((product) => product.categorySlug === card.slug);
      thumbnails[card.slug] = firstProduct?.thumbnailUrl ?? null;
    }

    return thumbnails;
  }, [products]);

  const electricFiltered = useMemo(() => {
    if (group !== "electric") return [];
    const q = search.trim().toLowerCase();
    const groupSubSlugs = new Set<string>(ELECTRIC_SUB_SLUGS);
    return products.filter((p) => {
      if (selectedSub === "all") {
        if (!groupSubSlugs.has(p.categorySlug)) return false;
      } else if (p.categorySlug !== selectedSub) {
        return false;
      }
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, selectedSub, group]);

  const groupLabel = group === "filter" ? "제품소개" : "전기·유공압";

  if (group === "filter") {
    const isWaterTab = urlCategorySlug === "water_treatment";

    return (
      <>
        <section className="mx-auto w-full max-w-6xl border-b border-border px-4">
          <nav className="flex flex-wrap gap-1 md:gap-4" aria-label="필터 카테고리">
            {FILTER_TABS.map((tab) => {
              const isActive = urlCategorySlug === tab.slug;

              return (
                <Link
                  key={tab.slug}
                  href={`/products?category=${tab.slug}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`border-b-2 px-3 py-4 text-sm font-medium transition-colors md:px-4 md:text-base ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </section>

        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {isWaterTab ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {WATER_SUB_CARDS.map((card) => {
                const thumbnailUrl = waterSubThumbnailBySlug[card.slug];

                return (
                  <Link
                    key={card.slug}
                    href={`/products/water/${card.path}`}
                    className="group relative block aspect-[4/3] min-h-[280px] overflow-hidden rounded-2xl bg-white dark:bg-muted"
                  >
                    {thumbnailUrl ? (
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnailUrl}
                          alt=""
                          aria-hidden
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : null}
                    <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/30" />
                    <div className="relative flex h-full min-h-[280px] items-center justify-center p-8">
                      <h3 className="text-2xl font-bold text-white">{card.label}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : filterTabProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-elevated px-6 py-16 text-center">
              <Package className="h-10 w-10 text-muted-foreground" aria-hidden />
              <p className="font-medium text-foreground">표시할 제품이 없습니다.</p>
              <p className="max-w-md text-sm text-muted-foreground">다른 카테고리 탭을 선택해 보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterTabProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pt-8 pb-6">
        <div className="flex items-center gap-2 md:flex-wrap md:gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제품명을 입력하세요"
            aria-label="제품명 검색"
            className="min-w-0 flex-1 rounded-lg border border-border bg-elevated px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary md:w-64 md:flex-none"
            autoComplete="off"
          />

          <div className="relative shrink-0 md:hidden">
            <select
              value={selectedSub}
              onChange={(e) => setSelectedSub(e.target.value)}
              aria-label={`${groupLabel} 카테고리`}
              className="h-full appearance-none rounded-lg border border-border bg-elevated py-2 pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">전체</option>
              {categoryChips.map((chip) => (
                <option key={chip.slug} value={chip.slug}>
                  {chip.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>

          <div
            className="hidden flex-wrap gap-2 md:flex"
            role="tablist"
            aria-label={`${groupLabel} 카테고리`}
          >
            <button
              type="button"
              onClick={() => setSelectedSub("all")}
              aria-selected={selectedSub === "all"}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedSub === "all" ? "bg-primary text-white" : "bg-elevated text-muted-foreground"
              }`}
            >
              전체
            </button>
            {categoryChips.map((chip) => {
              const active = selectedSub === chip.slug;
              return (
                <button
                  key={chip.slug}
                  type="button"
                  onClick={() => setSelectedSub(chip.slug)}
                  aria-selected={active}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-white" : "bg-elevated text-muted-foreground"
                  }`}
                >
                  {chip.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {electricFiltered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-elevated px-6 py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="font-medium text-foreground">표시할 제품이 없습니다.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              검색어를 바꾸거나 &apos;전체&apos;·다른 카테고리를 선택해 보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {electricFiltered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};
