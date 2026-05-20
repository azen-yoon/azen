import type { SupabaseClient } from "@supabase/supabase-js";

export const ADMIN_IMAGE_BUCKET = "product-images";

export const getStoragePathFromPublicUrl = (url: string, bucket = ADMIN_IMAGE_BUCKET) => {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  const encodedPath = url.slice(index + marker.length).split("?")[0].split("#")[0];
  if (!encodedPath) {
    return null;
  }

  return decodeURIComponent(encodedPath);
};

export const collectStoragePathsFromUrls = (
  urls: Array<string | null | undefined>,
  bucket = ADMIN_IMAGE_BUCKET,
) => {
  const uniquePaths = new Set<string>();

  for (const url of urls) {
    if (!url) continue;

    const storagePath = getStoragePathFromPublicUrl(url, bucket);
    if (storagePath) {
      uniquePaths.add(storagePath);
    }
  }

  return [...uniquePaths];
};

export const removeStoragePaths = async (
  supabase: SupabaseClient,
  paths: string[],
  bucket = ADMIN_IMAGE_BUCKET,
): Promise<{ error: string | null }> => {
  if (paths.length === 0) {
    return { error: null };
  }

  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    return { error: error.message };
  }

  return { error: null };
};

export const removeStorageFileByUrl = async (
  supabase: SupabaseClient,
  url: string | null | undefined,
  bucket = ADMIN_IMAGE_BUCKET,
): Promise<{ error: string | null }> => {
  const storagePath = url ? getStoragePathFromPublicUrl(url, bucket) : null;
  if (!storagePath) {
    return { error: null };
  }

  return removeStoragePaths(supabase, [storagePath], bucket);
};

interface DeleteManagedImageOptions {
  supabase: SupabaseClient;
  table: "azen_product_images" | "azen_service_case_images";
  parentColumn: "product_id" | "case_id";
  parentId: string;
  imageId: string;
  bucket?: string;
}

export const deleteManagedAdditionalImage = async ({
  supabase,
  table,
  parentColumn,
  parentId,
  imageId,
  bucket = ADMIN_IMAGE_BUCKET,
}: DeleteManagedImageOptions): Promise<{ error: string | null }> => {
  const { data: imageRow, error: fetchError } = await supabase
    .from(table)
    .select("id, url")
    .eq("id", imageId)
    .eq(parentColumn, parentId)
    .maybeSingle();

  if (fetchError) {
    return { error: `이미지 조회에 실패했습니다: ${fetchError.message}` };
  }

  if (!imageRow) {
    return { error: "삭제할 이미지를 찾을 수 없습니다." };
  }

  const storagePath = getStoragePathFromPublicUrl(imageRow.url, bucket);
  if (storagePath) {
    const { error: storageError } = await removeStoragePaths(supabase, [storagePath], bucket);
    if (storageError) {
      return { error: `Storage 파일 삭제에 실패했습니다: ${storageError}` };
    }
  }

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq("id", imageId)
    .eq(parentColumn, parentId);

  if (deleteError) {
    return { error: `이미지 DB 삭제에 실패했습니다: ${deleteError.message}` };
  }

  return { error: null };
};

export const removeReplacedThumbnailFromStorage = async (
  supabase: SupabaseClient,
  previousUrl: string | null | undefined,
  nextUrl: string | null | undefined,
  bucket = ADMIN_IMAGE_BUCKET,
): Promise<{ error: string | null }> => {
  if (!previousUrl || previousUrl === nextUrl) {
    return { error: null };
  }

  return removeStorageFileByUrl(supabase, previousUrl, bucket);
};
