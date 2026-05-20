"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Link as LinkIcon, Save, Trash2, Upload } from "lucide-react";
import { AdminImageDeleteButton } from "@/components/features/AdminImageDeleteButton";
import { AdminServiceCaseDeleteButton } from "@/components/features/AdminServiceCaseDeleteButton";
import type { ServiceCaseDetail, ServiceCaseImageRow } from "@/lib/admin-service-cases";
import {
  ADMIN_IMAGE_ACCEPT,
  ADMIN_IMAGE_UPLOAD_FIELDS,
  convertFormDataImagesToWebP,
  UnsupportedImageTypeError,
} from "@/lib/image-webp";

interface ServiceCaseFormState {
  error: string | null;
}

interface AdminServiceCaseFormProps {
  mode: "create" | "edit";
  initialCase?: ServiceCaseDetail;
  existingImages?: ServiceCaseImageRow[];
  action: (state: ServiceCaseFormState, formData: FormData) => Promise<ServiceCaseFormState>;
  deleteImageAction?: (formData: FormData) => Promise<void>;
  deleteCaseAction?: (formData: FormData) => Promise<void>;
}

interface UrlInputItem {
  url: string;
  caption: string;
}

export const AdminServiceCaseForm = ({
  mode,
  initialCase,
  existingImages = [],
  action,
  deleteImageAction,
  deleteCaseAction,
}: AdminServiceCaseFormProps) => {
  const router = useRouter();
  const [state, formAction] = useActionState(action, { error: null });
  const [isPending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);
  const [isConvertingImages, setIsConvertingImages] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [thumbnailMode, setThumbnailMode] = useState<"file" | "url">("file");
  const [additionalMode, setAdditionalMode] = useState<"file" | "url">("file");
  const [additionalUrlInputs, setAdditionalUrlInputs] = useState<UrlInputItem[]>([{ url: "", caption: "" }]);
  const [additionalFileInputKeys, setAdditionalFileInputKeys] = useState([0]);
  const [additionalFileCaptions, setAdditionalFileCaptions] = useState<Record<number, string>>({});
  const [additionalFilePreviews, setAdditionalFilePreviews] = useState<Record<number, string>>({});
  const previewUrlsRef = useRef<Record<number, string>>({});

  const listPath = "/admin/service";
  const pageTitle = mode === "create" ? "시공사례 등록" : "시공사례 수정";
  const submitLabel = mode === "create" ? "시공사례 저장" : "수정 저장";
  const currentThumbnailUrl = useMemo(() => initialCase?.thumbnail_url ?? "", [initialCase?.thumbnail_url]);

  useEffect(() => {
    previewUrlsRef.current = additionalFilePreviews;
  }, [additionalFilePreviews]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleBackClick = () => {
    if (isDirty) {
      const shouldMove = window.confirm("저장하지 않은 변경사항이 있습니다. 목록으로 이동할까요?");
      if (!shouldMove) {
        return;
      }
    }

    router.push(listPath);
  };

  const addAdditionalUrlInput = () => {
    setAdditionalUrlInputs((prev) => [...prev, { url: "", caption: "" }]);
    setIsDirty(true);
  };

  const updateAdditionalUrlInput = (index: number, key: keyof UrlInputItem, value: string) => {
    setAdditionalUrlInputs((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
    setIsDirty(true);
  };

  const removeAdditionalUrlInput = (index: number) => {
    setAdditionalUrlInputs((prev) =>
      prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index),
    );
    setIsDirty(true);
  };

  const addAdditionalFileInput = () => {
    setAdditionalFileInputKeys((prev) => [...prev, prev.length > 0 ? Math.max(...prev) + 1 : 0]);
    setIsDirty(true);
  };

  const revokePreview = (key: number) => {
    const previewUrl = additionalFilePreviews[key];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const removeAdditionalFileInput = (key: number) => {
    revokePreview(key);
    setAdditionalFileInputKeys((prev) => (prev.length === 1 ? prev : prev.filter((item) => item !== key)));
    setAdditionalFileCaptions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setAdditionalFilePreviews((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setIsDirty(true);
  };

  const handleAdditionalFileChange = (key: number, file: File | undefined) => {
    revokePreview(key);

    if (!file) {
      setAdditionalFilePreviews((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setIsDirty(true);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAdditionalFilePreviews((prev) => ({ ...prev, [key]: previewUrl }));
    setIsDirty(true);
  };

  const updateAdditionalFileCaption = (key: number, value: string) => {
    setAdditionalFileCaptions((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImageUploadError(null);
    setIsConvertingImages(true);

    try {
      let formData = new FormData(event.currentTarget);
      formData = await convertFormDataImagesToWebP(formData, ADMIN_IMAGE_UPLOAD_FIELDS);
      setIsDirty(false);
      startTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      setImageUploadError(
        error instanceof UnsupportedImageTypeError || error instanceof Error
          ? error.message
          : "이미지 변환에 실패했습니다.",
      );
    } finally {
      setIsConvertingImages(false);
    }
  };

  const isSaving = isPending || isConvertingImages;

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => setIsDirty(true)}
      className="glass-card space-y-5 rounded-2xl border border-border p-5"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBackClick}
          aria-label="목록으로 이동"
          className="inline-flex items-center justify-center rounded-md border border-border p-2 hover:bg-muted"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="inline-flex items-center gap-1">
            제목 <span className="text-red-500">*</span>
          </span>
          <input
            name="title"
            required
            defaultValue={initialCase?.title ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3 py-2"
            placeholder="시공사례 제목을 입력하세요"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          정렬순서
          <input
            type="number"
            name="sort_order"
            defaultValue={initialCase?.sort_order ?? 0}
            className="h-10 rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={initialCase?.is_published ?? true}
            className="h-4 w-4"
          />
          공개 상태
        </label>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">대표 이미지</p>
        {currentThumbnailUrl && (
          <div className="flex aspect-[4/3] w-full max-w-md items-center justify-center overflow-hidden rounded-md border border-border bg-elevated">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentThumbnailUrl} alt="기존 대표 이미지" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setThumbnailMode("file")}
            className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs ${
              thumbnailMode === "file" ? "border-primary bg-primary text-white" : "border-border"
            }`}
          >
            <Upload size={14} />
            파일 업로드
          </button>
          <button
            type="button"
            onClick={() => setThumbnailMode("url")}
            className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs ${
              thumbnailMode === "url" ? "border-primary bg-primary text-white" : "border-border"
            }`}
          >
            <LinkIcon size={14} />
            URL 입력
          </button>
        </div>
        <input type="hidden" name="thumbnail_mode" value={thumbnailMode} />
        {thumbnailMode === "file" ? (
          <input
            type="file"
            name="thumbnail_file"
            accept={ADMIN_IMAGE_ACCEPT}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        ) : (
          <input
            name="thumbnail_url"
            defaultValue={currentThumbnailUrl}
            placeholder="https://example.com/thumbnail.jpg"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        )}
        <label className="flex flex-col gap-1 text-sm">
          대표 이미지 캡션
          <input
            name="thumbnail_caption"
            defaultValue={initialCase?.thumbnail_caption ?? ""}
            placeholder="대표 이미지 설명(선택)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </section>

      {mode === "edit" && (
        <section className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium">기존 추가 이미지</p>
          {existingImages.length === 0 ? (
            <p className="text-xs text-muted-foreground">등록된 추가 이미지가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {existingImages.map((image) => (
                <div key={image.id} className="flex items-center gap-3 rounded-md border border-border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="기존 추가 이미지" className="h-16 w-16 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs text-muted-foreground">{image.url}</p>
                    <p className="mt-1 text-sm text-foreground">{image.caption?.trim() || "캡션 없음"}</p>
                  </div>
                  {deleteImageAction && (
                    <AdminImageDeleteButton action={deleteImageAction} imageId={image.id} imageUrl={image.url} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">{mode === "create" ? "추가 이미지" : "새 추가 이미지"}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAdditionalMode("file")}
            className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs ${
              additionalMode === "file" ? "border-primary bg-primary text-white" : "border-border"
            }`}
          >
            <ImagePlus size={14} />
            파일 업로드
          </button>
          <button
            type="button"
            onClick={() => setAdditionalMode("url")}
            className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs ${
              additionalMode === "url" ? "border-primary bg-primary text-white" : "border-border"
            }`}
          >
            <LinkIcon size={14} />
            URL 입력
          </button>
        </div>
        <input type="hidden" name="additional_mode" value={additionalMode} />
        {additionalMode === "file" ? (
          <div className="space-y-2">
            {additionalFileInputKeys.map((key) => (
              <div key={`additional-file-${key}`} className="space-y-2 rounded-md border border-border p-3">
                <div className="flex gap-2">
                  <input
                    type="file"
                    name="additional_image_files"
                    accept={ADMIN_IMAGE_ACCEPT}
                    onChange={(event) => handleAdditionalFileChange(key, event.target.files?.[0])}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeAdditionalFileInput(key)}
                    className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
                    aria-label="추가 이미지 파일 선택칸 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {additionalFilePreviews[key] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={additionalFilePreviews[key]}
                      alt="선택한 추가 이미지 미리보기"
                      className="h-16 w-16 rounded object-cover"
                    />
                    <input
                      name="additional_image_captions"
                      value={additionalFileCaptions[key] ?? ""}
                      onChange={(event) => updateAdditionalFileCaption(key, event.target.value)}
                      placeholder="이미지 캡션(선택)"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={addAdditionalFileInput}
              className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
            >
              파일 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {additionalUrlInputs.map((item, index) => (
              <div key={`additional-url-${index}`} className="space-y-2 rounded-md border border-border p-3">
                <div className="flex gap-2">
                  <input
                    name="additional_image_urls"
                    value={item.url}
                    onChange={(event) => updateAdditionalUrlInput(index, "url", event.target.value)}
                    placeholder="https://example.com/gallery-image.jpg"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeAdditionalUrlInput(index)}
                    className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
                    aria-label="추가 이미지 URL 입력칸 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  name="additional_image_url_captions"
                  value={item.caption}
                  onChange={(event) => updateAdditionalUrlInput(index, "caption", event.target.value)}
                  placeholder="이미지 캡션(선택)"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addAdditionalUrlInput}
              className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
            >
              URL 입력칸 추가
            </button>
          </div>
        )}
      </section>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {imageUploadError && <p className="text-sm text-red-500">{imageUploadError}</p>}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex w-36 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <Save size={15} />
          {isConvertingImages ? "이미지 변환 중..." : isPending ? "저장 중..." : submitLabel}
        </button>
        {mode === "edit" && initialCase && deleteCaseAction && (
          <AdminServiceCaseDeleteButton
            action={deleteCaseAction}
            caseId={initialCase.id}
            caseTitle={initialCase.title}
          />
        )}
      </div>
    </form>
  );
};
