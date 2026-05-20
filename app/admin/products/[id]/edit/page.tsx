import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminProductEditForm } from "@/components/features/AdminProductEditForm";
import {
  ADMIN_IMAGE_BUCKET,
  collectStoragePathsFromUrls,
  deleteManagedAdditionalImage,
  removeReplacedThumbnailFromStorage,
  removeStoragePaths,
} from "@/lib/admin-storage";
import { createStoragePath, isValidUrl } from "@/lib/admin-service-cases";
import { createClient } from "@/lib/supabase/server";

interface AdminProductEditPageProps {
  params: Promise<{ id: string }>;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface UpdateProductFormState {
  error: string | null;
}

interface ProductImageRow {
  id: string;
  url: string;
  sort_order: number;
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

export default async function AdminProductEditPage({ params }: AdminProductEditPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: images }] = await Promise.all([
    supabase
      .from("azen_products")
      .select(
        "id, name, category_id, description, content, content_overview, content_technology, content_application, spec, spec_items, thumbnail_url, is_published, sort_order",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("azen_categories").select("id, name").not("parent_id", "is", null),
    supabase
      .from("azen_product_images")
      .select("id, url, sort_order")
      .eq("product_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!product) {
    redirect("/admin/list?toast=updated");
  }

  const categoryOptions: CategoryOption[] = ((categories ?? []) as CategoryOption[]).sort((a, b) => {
    const orderDiff = getCategoryOrderIndex(a.name) - getCategoryOrderIndex(b.name);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return a.name.localeCompare(b.name, "ko");
  });

  const productImages = (images ?? []) as ProductImageRow[];

  const updateProductAction = async (
    _: UpdateProductFormState,
    formData: FormData,
  ): Promise<UpdateProductFormState> => {
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
    const previousThumbnailUrl = product.thumbnail_url;
    let nextThumbnailUrl: string | null = product.thumbnail_url;

    if (thumbnailMode === "url") {
      const inputUrl = String(formData.get("thumbnail_url") ?? "").trim();
      if (inputUrl) {
        if (!isValidUrl(inputUrl)) {
          return { error: "대표 이미지 URL 형식이 올바르지 않습니다." };
        }
        nextThumbnailUrl = inputUrl;
      }
    } else {
      const thumbnailFile = formData.get("thumbnail_file");
      if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
        const thumbnailPath = createStoragePath(`${id}/thumbnail`, thumbnailFile.name);
        const { error: uploadError } = await actionClient.storage
          .from(ADMIN_IMAGE_BUCKET)
          .upload(thumbnailPath, thumbnailFile, {
            contentType: thumbnailFile.type || "image/jpeg",
            upsert: false,
          });
        if (uploadError) {
          return { error: `대표 이미지 업로드에 실패했습니다: ${uploadError.message}` };
        }
        const { data } = actionClient.storage.from(ADMIN_IMAGE_BUCKET).getPublicUrl(thumbnailPath);
        nextThumbnailUrl = data.publicUrl;
      }
    }

    const { error: updateError } = await actionClient
      .from("azen_products")
      .update({
        name,
        category_id: categoryId,
        description: description || null,
        content: content || null,
        content_overview: contentOverview || null,
        content_technology: contentTechnology || null,
        content_application: contentApplication || null,
        spec: spec || null,
        spec_items: specItems,
        thumbnail_url: nextThumbnailUrl,
        is_published: isPublished,
        sort_order: sortOrder,
      })
      .eq("id", id);

    if (updateError) {
      return { error: `제품 수정에 실패했습니다: ${updateError.message}` };
    }

    const { error: thumbnailCleanupError } = await removeReplacedThumbnailFromStorage(
      actionClient,
      previousThumbnailUrl,
      nextThumbnailUrl,
    );
    if (thumbnailCleanupError) {
      return { error: `이전 대표 이미지 Storage 삭제에 실패했습니다: ${thumbnailCleanupError}` };
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
          product_id: id,
          url,
          sort_order: (productImages.at(-1)?.sort_order ?? -1) + index + 1,
        });
      }
    } else {
      const files = formData
        .getAll("additional_image_files")
        .filter((value): value is File => value instanceof File && value.size > 0);
      for (const [index, file] of files.entries()) {
        const path = createStoragePath(`${id}/gallery`, file.name, index);
        const { error: uploadError } = await actionClient.storage.from(ADMIN_IMAGE_BUCKET).upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (uploadError) {
          return { error: `추가 이미지 업로드에 실패했습니다: ${uploadError.message}` };
        }
        const { data } = actionClient.storage.from(ADMIN_IMAGE_BUCKET).getPublicUrl(path);
        additionalRows.push({
          product_id: id,
          url: data.publicUrl,
          sort_order: (productImages.at(-1)?.sort_order ?? -1) + index + 1,
        });
      }
    }

    if (additionalRows.length > 0) {
      const { error: imageInsertError } = await actionClient.from("azen_product_images").insert(additionalRows);
      if (imageInsertError) {
        return { error: `추가 이미지 저장에 실패했습니다: ${imageInsertError.message}` };
      }
    }

    redirect("/admin/list");
  };

  const deleteImageAction = async (formData: FormData): Promise<{ error: string | null }> => {
    "use server";

    const imageId = String(formData.get("image_id") ?? "");
    if (!imageId) {
      return { error: "삭제할 이미지 ID가 없습니다." };
    }

    const actionClient = await createClient();
    const result = await deleteManagedAdditionalImage({
      supabase: actionClient,
      table: "azen_product_images",
      parentColumn: "product_id",
      parentId: id,
      imageId,
    });

    if (result.error) {
      return result;
    }

    revalidatePath(`/admin/products/${id}/edit`);
    return { error: null };
  };

  const deleteProductAction = async (formData: FormData) => {
    "use server";

    void formData;
    const actionClient = await createClient();
    const [{ data: productRow }, { data: imageRows }] = await Promise.all([
      actionClient.from("azen_products").select("thumbnail_url").eq("id", id).maybeSingle(),
      actionClient.from("azen_product_images").select("url").eq("product_id", id),
    ]);

    const storagePaths = collectStoragePathsFromUrls([
      productRow?.thumbnail_url ?? null,
      ...(imageRows ?? []).map((image) => image.url),
    ]);

    if (storagePaths.length > 0) {
      const { error: storageError } = await removeStoragePaths(actionClient, storagePaths);
      if (storageError) {
        throw new Error(`Storage 파일 삭제에 실패했습니다: ${storageError}`);
      }
    }

    const { error: imagesDeleteError } = await actionClient.from("azen_product_images").delete().eq("product_id", id);
    if (imagesDeleteError) {
      throw new Error(`추가 이미지 DB 삭제에 실패했습니다: ${imagesDeleteError.message}`);
    }

    const { error: productDeleteError } = await actionClient.from("azen_products").delete().eq("id", id);
    if (productDeleteError) {
      throw new Error(`제품 DB 삭제에 실패했습니다: ${productDeleteError.message}`);
    }

    redirect("/admin/list?toast=deleted");
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <p className="text-sm text-muted-foreground">기존 정보를 수정하고 이미지를 관리할 수 있습니다.</p>
      <AdminProductEditForm
        categories={categoryOptions}
        product={product}
        images={productImages}
        updateAction={updateProductAction}
        deleteImageAction={deleteImageAction}
        deleteProductAction={deleteProductAction}
      />
    </main>
  );
}
