export const SERVICE_CASE_IMAGE_BUCKET = "product-images";

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

export const getStoragePathFromPublicUrl = (url: string) => {
  const marker = `/storage/v1/object/public/${SERVICE_CASE_IMAGE_BUCKET}/`;
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

export const collectStoragePathsFromUrls = (urls: Array<string | null | undefined>) => {
  const uniquePaths = new Set<string>();

  for (const url of urls) {
    if (!url) continue;

    const storagePath = getStoragePathFromPublicUrl(url);
    if (storagePath) {
      uniquePaths.add(storagePath);
    }
  }

  return [...uniquePaths];
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
