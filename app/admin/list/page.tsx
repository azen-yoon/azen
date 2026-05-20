import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { AdminProductListControls } from "@/components/features/AdminProductListControls";
import { createClient } from "@/lib/supabase/server";

interface ProductListRow {
  id: string;
  name: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  category: {
    name: string;
  } | null;
}

/** PostgREST/Supabase 타입은 FK 임베드를 배열로 두는 경우가 있어 단일 객체로 맞춘다. */
const normalizeCategory = (category: unknown): ProductListRow["category"] => {
  if (category == null) return null;
  if (Array.isArray(category)) {
    const first = category[0];
    if (first && typeof first === "object" && first !== null && "name" in first) {
      return { name: String((first as { name: unknown }).name) };
    }
    return null;
  }
  if (typeof category === "object" && category !== null && "name" in category) {
    return { name: String((category as { name: unknown }).name) };
  }
  return null;
};

interface CategoryOption {
  id: string;
  name: string;
}

interface AdminListPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: "name_asc" | "name_desc" | "created_desc" | "created_asc";
    toast?: "created" | "updated" | "deleted";
  }>;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const categoryOrderKeywords = ["공조기", "수처리", "집진기", "기타 품목", "전기", "유압공", "유공압"] as const;

const getCategoryOrderIndex = (name: string) => {
  const matchedIndex = categoryOrderKeywords.findIndex((keyword) => name.includes(keyword));
  return matchedIndex === -1 ? Number.MAX_SAFE_INTEGER : matchedIndex;
};

export default async function AdminListPage({ searchParams }: AdminListPageProps) {
  const params = await searchParams;
  const keyword = (params.search ?? "").trim();
  const selectedCategory = (params.category ?? "").trim();
  const selectedSort = params.sort ?? "created_desc";

  const supabase = await createClient();
  const [{ data: categories }, productResult] = await Promise.all([
    supabase.from("azen_categories").select("id, name").not("parent_id", "is", null),
    (async () => {
      let query = supabase
        .from("azen_products")
        .select("id, name, is_published, sort_order, created_at, category:azen_categories(name)");

      if (keyword) {
        query = query.ilike("name", `%${keyword}%`);
      }
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      switch (selectedSort) {
        case "name_asc":
          query = query.order("name", { ascending: true });
          break;
        case "name_desc":
          query = query.order("name", { ascending: false });
          break;
        case "created_asc":
          query = query.order("created_at", { ascending: true });
          break;
        case "created_desc":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      return query;
    })(),
  ]);

  const categoryOptions: CategoryOption[] = ((categories ?? []) as CategoryOption[]).sort((a, b) => {
    const orderDiff = getCategoryOrderIndex(a.name) - getCategoryOrderIndex(b.name);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return a.name.localeCompare(b.name, "ko");
  });
  const productRows: ProductListRow[] = (productResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    is_published: row.is_published,
    sort_order: row.sort_order,
    created_at: row.created_at,
    category: normalizeCategory(row.category),
  }));
  const error = productResult.error;

  return (
    <main className="mx-auto w-full max-w-6xl p-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">제품 등록</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} />
          제품 등록
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">등록된 제품을 관리할 수 있습니다.</p>

      <div className="mt-5">
        {!error && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="px-1 text-sm font-semibold">총 {productRows.length}개 등록</p>
            <AdminProductListControls
              categories={categoryOptions}
              initialSearch={keyword}
              initialCategory={selectedCategory}
              initialSort={selectedSort}
            />
          </div>
        )}

        {error ? (
          <section className="glass-card rounded-2xl border border-border p-6">
            <p className="text-sm text-red-500">제품 목록을 불러오지 못했습니다: {error.message}</p>
          </section>
        ) : productRows.length === 0 ? (
          <section className="glass-card rounded-2xl border border-border p-10 text-center">
            <Tag className="mx-auto mb-3 text-muted-foreground" size={28} />
            <p className="text-base font-medium">조건에 맞는 제품이 없습니다.</p>
            <p className="mt-1 text-sm text-muted-foreground">검색어 또는 필터 조건을 변경해보세요.</p>
          </section>
        ) : (
          <section className="mt-2 glass-card overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="px-4 py-3 font-medium">제품명</th>
                  <th className="px-4 py-3 font-medium">카테고리</th>
                  <th className="px-4 py-3 font-medium">공개여부</th>
                  <th className="px-4 py-3 font-medium">정렬순서</th>
                  <th className="px-4 py-3 font-medium">등록일</th>
                </tr>
              </thead>
              <tbody>
                {productRows.map((product, index) => (
                  <tr key={product.id} className="border-b border-border/80 last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">{productRows.length - index}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="underline-offset-4 hover:text-primary hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.category?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                          product.is_published
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                            : "border-gray-400/40 bg-gray-400/15 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {product.is_published ? "공개" : "비공개"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{product.sort_order}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(product.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}
