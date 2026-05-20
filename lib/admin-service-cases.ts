export const SERVICE_CASE_IMAGE_BUCKET = "product-images";

export {
  ADMIN_IMAGE_BUCKET,
  collectStoragePathsFromUrls,
  getStoragePathFromPublicUrl,
} from "@/lib/admin-storage";

export interface ServiceCaseImageRow {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
}

export interface ServiceCaseDetail {
  id: string;
  title: string;
  thumbnail_url: string | null;
  thumbnail_caption: string | null;
  is_published: boolean;
  sort_order: number;
}

export const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const createStoragePath = (folder: string, filename: string, order = 0) => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  return `${folder}/${Date.now()}-${order}.${ext}`;
};

export const parseExistingServiceCaseImageCaptions = (
  value: FormDataEntryValue | null,
): Record<string, string> => {
  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, caption]) => typeof caption === "string")
        .map(([imageId, caption]) => [imageId, caption.trim()]),
    );
  } catch {
    return {};
  }
};
