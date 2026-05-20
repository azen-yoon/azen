import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminProductCreateForm } from "@/components/features/AdminProductCreateForm";
import { createStoragePath, isValidUrl } from "@/lib/admin-service-cases";
import { createClient } from "@/lib/supabase/server";

interface CategoryOption {
  id: string;
  name: string;
}

interface CreateProductFormState {
  error: string | null;
}

interface ProductSpecItem {
  title: string;
  content: string;
}

const categoryOrderKeywords = ["공조기", "수처리", "집진기", "기타 품목", "전기", "유압공", "유공압"] as const;

const getCategoryOrderIndex = (name: string) => {
  const matchedIndex = categoryOrderKeywords.findIndex((keyword) => name.includes(keyword));
  return matchedIndex === -1 ? Number.MAX_SAFE_INTEGER : matchedIndex;
};

const parseSpecItems = (value: FormDataEntryValue | null): ProductSpecItem[] => {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
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
  } catch {
    return [];
  }
};

export default async function AdminProductNewPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("azen_categories")
    .select("id, name")
    .not("parent_id", "is", null)
    .order("sort_order", { ascending: true });

  const categoryOptions: CategoryOption[] = ((categories ?? []) as CategoryOption[]).sort((a, b) => {
    const orderDiff = getCategoryOrderIndex(a.name) - getCategoryOrderIndex(b.name);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return a.name.localeCompare(b.name, "ko");
  });

  const createProductAction = async (
    _: CreateProductFormState,
    formData: FormData,
  ): Promise<CreateProductFormState> => {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const contentOverview = String(formData.get("content_overview") ?? "").trim();
    const contentTechnology = String(formData.get("content_technology") ?? "").trim();
    const contentApplication = String(formData.get("content_application") ?? "").trim();
    const spec = String(formData.get("spec") ?? "").trim();
    const specItems = parseSpecItems(formData.get("spec_items"));
    const isPublished = formData.get("is_published") === "on";
    const sortOrder = Number(String(formData.get("sort_order") ?? "0")) || 0;
    const thumbnailMode = String(formData.get("thumbnail_mode") ?? "file");
    const additionalMode = String(formData.get("additional_mode") ?? "file");

    if (!name) {
      return { error: "제품명을 입력해주세요." };
    }
    if (!categoryId) {
      return { error: "카테고리를 선택해주세요." };
    }

    const actionClient = await createClient();

    let thumbnailUrl: string | null = null;
    if (thumbnailMode === "url") {
      const directUrl = String(formData.get("thumbnail_url") ?? "").trim();
      if (directUrl) {
        if (!isValidUrl(directUrl)) {
          return { error: "대표 이미지 URL 형식이 올바르지 않습니다." };
        }
        thumbnailUrl = directUrl;
      }
    } else {
      const thumbnailFile = formData.get("thumbnail_file");
      if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
        const thumbnailPath = createStoragePath("thumbnails", thumbnailFile.name);
        const { error: uploadError } = await actionClient.storage
          .from("product-images")
          .upload(thumbnailPath, thumbnailFile, {
            contentType: thumbnailFile.type || "image/jpeg",
            upsert: false,
          });
        if (uploadError) {
          return { error: `대표 이미지 업로드에 실패했습니다: ${uploadError.message}` };
        }
        const { data } = actionClient.storage.from("product-images").getPublicUrl(thumbnailPath);
        thumbnailUrl = data.publicUrl;
      }
    }

    const { data: insertedProduct, error: productInsertError } = await actionClient
      .from("azen_products")
      .insert({
        category_id: categoryId,
        name,
        description: description || null,
        content: content || null,
        content_overview: contentOverview || null,
        content_technology: contentTechnology || null,
        content_application: contentApplication || null,
        spec: spec || null,
        spec_items: specItems,
        thumbnail_url: thumbnailUrl,
        is_published: isPublished,
        sort_order: sortOrder,
      })
      .select("id")
      .single();

    if (productInsertError || !insertedProduct) {
      return { error: `제품 저장에 실패했습니다: ${productInsertError?.message ?? "알 수 없는 오류"}` };
    }

    const additionalRows: Array<{ product_id: string; url: string; sort_order: number }> = [];
    if (additionalMode === "url") {
      const urls = formData
        .getAll("additional_image_urls")
        .map((value) => String(value).trim())
        .filter(Boolean);
      for (const [index, url] of urls.entries()) {
        if (!isValidUrl(url)) {
          return { error: `추가 이미지 URL(${index + 1}번째) 형식이 올바르지 않습니다.` };
        }
        additionalRows.push({
          product_id: insertedProduct.id,
          url,
          sort_order: index,
        });
      }
    } else {
      const files = formData
        .getAll("additional_image_files")
        .filter((value): value is File => value instanceof File && value.size > 0);
      for (const [index, file] of files.entries()) {
        const path = createStoragePath(`${insertedProduct.id}/gallery`, file.name, index);
        const { error: uploadError } = await actionClient.storage.from("product-images").upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (uploadError) {
          return { error: `추가 이미지 업로드에 실패했습니다: ${uploadError.message}` };
        }
        const { data } = actionClient.storage.from("product-images").getPublicUrl(path);
        additionalRows.push({
          product_id: insertedProduct.id,
          url: data.publicUrl,
          sort_order: index,
        });
      }
    }

    if (additionalRows.length > 0) {
      const { error: imageInsertError } = await actionClient.from("azen_product_images").insert(additionalRows);
      if (imageInsertError) {
        return { error: `추가 이미지 저장에 실패했습니다: ${imageInsertError.message}` };
      }
    }

    redirect("/admin/list?toast=created");
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/list"
          aria-label="목록으로 이동"
          className="inline-flex items-center justify-center rounded-md border border-border p-2 hover:bg-muted"
        >
          <ArrowLeft size={16} aria-hidden />
        </Link>
        <h1 className="text-xl font-semibold">제품 등록</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        제품 기본 정보와 대표/추가 이미지를 입력하면 관리자 대시보드에 바로 반영됩니다.
      </p>
      <AdminProductCreateForm categories={categoryOptions} action={createProductAction} />
    </main>
  );
}
