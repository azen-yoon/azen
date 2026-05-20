export class UnsupportedImageTypeError extends Error {
  constructor(filename: string) {
    super(
      `지원하지 않는 파일 형식입니다: ${filename}. JPG, PNG, GIF, WebP, BMP 이미지만 업로드할 수 있습니다.`,
    );
    this.name = "UnsupportedImageTypeError";
  }
}

export const ADMIN_IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/bmp";

const CONVERTIBLE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
]);

export const isConvertibleImageFile = (file: File): boolean =>
  CONVERTIBLE_MIME_TYPES.has(file.type) || (file.type.startsWith("image/") && file.type !== "image/svg+xml");

const toWebpFilename = (filename: string) => {
  const base = filename.replace(/\.[^.]+$/, "").trim() || "image";
  return `${base}.webp`;
};

export const convertImageFileToWebP = async (file: File, quality = 0.82): Promise<File> => {
  if (!isConvertibleImageFile(file)) {
    throw new UnsupportedImageTypeError(file.name);
  }

  if (file.type === "image/webp") {
    return file.name.toLowerCase().endsWith(".webp")
      ? file
      : new File([file], toWebpFilename(file.name), { type: "image/webp", lastModified: file.lastModified });
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("이미지 변환에 실패했습니다.");
    }

    context.drawImage(image, 0, 0);

    const blob = await canvasToWebPBlob(canvas, quality);
    return new File([blob], toWebpFilename(file.name), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    throw new UnsupportedImageTypeError(file.name);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const convertFormDataImagesToWebP = async (
  formData: FormData,
  fileFieldNames: readonly string[],
): Promise<FormData> => {
  const fileFieldSet = new Set(fileFieldNames);
  const next = new FormData();

  for (const [key, value] of formData.entries()) {
    if (fileFieldSet.has(key) && value instanceof File && value.size > 0) {
      next.append(key, await convertImageFileToWebP(value));
    } else {
      next.append(key, value);
    }
  }

  return next;
};

export const ADMIN_IMAGE_UPLOAD_FIELDS = ["thumbnail_file", "additional_image_files"] as const;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new UnsupportedImageTypeError("unknown"));
    image.src = src;
  });

const canvasToWebPBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("WebP 변환에 실패했습니다."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
