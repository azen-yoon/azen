/** GNB 필터 메뉴 제품군 (DB `azen_categories.slug`와 일치) */
export const FILTER_SUB_SLUGS = ["air_handling", "dust_collector", "water_treatment", "others"] as const;

/** 수처리 필터 하위 서브카테고리 (DB `azen_categories.slug`) */
export const WATER_SUB_SLUGS = ["water_depth", "water_carbon", "water_pleated"] as const;

export const WATER_SUB_CARDS = [
  {
    slug: "water_depth",
    path: "depth",
    label: "DEPTH",
    description: "뎁스 필터 제품 보기",
  },
  {
    slug: "water_carbon",
    path: "carbon",
    label: "CARBON",
    description: "카본 필터 제품 보기",
  },
  {
    slug: "water_pleated",
    path: "pleated",
    label: "PLEATED",
    description: "플리티드 필터 제품 보기",
  },
] as const;

export type WaterSubPath = (typeof WATER_SUB_CARDS)[number]["path"];

export const resolveWaterSubSlug = (sub: string): (typeof WATER_SUB_SLUGS)[number] | null => {
  const card = WATER_SUB_CARDS.find((item) => item.path === sub);
  return card?.slug ?? null;
};

/** GNB 전기/유공압 메뉴 제품군 */
export const ELECTRIC_SUB_SLUGS = ["electric_parts", "hydraulic"] as const;

export type ProductCatalogGroup = "filter" | "electric";

export const PARENT_SLUG_FILTER = "filter";
export const PARENT_SLUG_ELECTRIC = "electric";

export const CATALOG_GROUP_NAV_LABEL: Record<ProductCatalogGroup, string> = {
  filter: "제품소개",
  electric: "전기·유공압",
};

export const getCatalogBreadcrumbLabel = (slug: string, name: string): string => {
  if (slug === PARENT_SLUG_FILTER || name === "필터" || name === "제품 소개") return CATALOG_GROUP_NAV_LABEL.filter;
  if (slug === PARENT_SLUG_ELECTRIC) return CATALOG_GROUP_NAV_LABEL.electric;
  return name;
};

export const isFilterSubSlug = (s: string): boolean =>
  (FILTER_SUB_SLUGS as readonly string[]).includes(s);

export const isElectricSubSlug = (s: string): boolean =>
  (ELECTRIC_SUB_SLUGS as readonly string[]).includes(s);

export const isValidCatalogCategoryParam = (s: string): boolean =>
  s === PARENT_SLUG_FILTER ||
  s === PARENT_SLUG_ELECTRIC ||
  isFilterSubSlug(s) ||
  isElectricSubSlug(s);

export const resolveCatalogGroup = (slug: string): ProductCatalogGroup =>
  slug === PARENT_SLUG_ELECTRIC || isElectricSubSlug(slug) ? "electric" : "filter";

/** DB `name`이 없을 때 칩·모바일 셀렉트용 기본 라벨 */
export const CATALOG_SUB_LABEL_FALLBACK: Record<string, string> = {
  air_handling: "공조기 필터",
  dust_collector: "집진기 필터",
  water_treatment: "수처리 필터",
  water_depth: "DEPTH",
  water_carbon: "CARBON",
  water_pleated: "PLEATED",
  others: "기타 품목",
  electric_parts: "전기 부품",
  hydraulic: "유공압",
};

export type CatalogCategoryRow = {
  id: string;
  slug: string;
  parent_id: string | null;
};

/**
 * 카탈로그 그룹(필터 / 전기·유공압)에 속한 `azen_categories.id` 전부.
 * 부모 행(`filter` / `electric`)과 그 하위(트리)를 포함해, 시드·실DB 모두에서 안정적으로 매칭한다.
 */
export const catalogCategoryIdsForGroup = (
  rows: readonly CatalogCategoryRow[],
  group: ProductCatalogGroup,
): string[] => {
  const parentSlug = group === "filter" ? PARENT_SLUG_FILTER : PARENT_SLUG_ELECTRIC;
  const parentRow = rows.find((r) => r.slug === parentSlug);
  const idSet = new Set<string>();

  if (parentRow) {
    const queue = [parentRow.id];
    idSet.add(parentRow.id);
    while (queue.length) {
      const pid = queue.shift()!;
      for (const r of rows) {
        if (r.parent_id === pid && !idSet.has(r.id)) {
          idSet.add(r.id);
          queue.push(r.id);
        }
      }
    }
  }

  if (idSet.size === 0) {
    const subs = new Set<string>(
      group === "filter" ? FILTER_SUB_SLUGS : ELECTRIC_SUB_SLUGS,
    );
    for (const r of rows) {
      if (subs.has(r.slug)) idSet.add(r.id);
    }
  }

  return [...idSet];
};
