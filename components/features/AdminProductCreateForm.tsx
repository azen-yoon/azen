"use client";

import { useActionState, useState, useTransition } from "react";
import { FileText, ImagePlus, Link as LinkIcon, Plus, Save, Trash2, Upload, Wrench } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { CATALOG_SUB_LABEL_FALLBACK, WATER_SUB_SLUGS } from "@/lib/products-catalog";
import {
  ADMIN_IMAGE_ACCEPT,
  ADMIN_IMAGE_UPLOAD_FIELDS,
  convertFormDataImagesToWebP,
  UnsupportedImageTypeError,
} from "@/lib/image-webp";

interface CategoryOption {
  id: string;
  name: string;
  slug?: string;
}

interface CreateProductFormState {
  error: string | null;
}

interface SpecItemInput {
  title: string;
  content: string;
}

interface AdminProductCreateFormProps {
  categories: CategoryOption[];
  action: (state: CreateProductFormState, formData: FormData) => Promise<CreateProductFormState>;
}

const MAX_SPEC_ITEMS = 6;

const normalizeDescriptionForSave = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed.replace(/\n/g, "<br>") : "";
};

const formatDescriptionForEdit = (value: string | null) => value?.replace(/<br\s*\/?>/gi, "\n") ?? "";

const WATER_SUB_LABELS = new Set(
  WATER_SUB_SLUGS.map((slug) => CATALOG_SUB_LABEL_FALLBACK[slug]),
);

const getCategorySlug = (category: CategoryOption): string | undefined => {
  if (category.slug) return category.slug;
  const match = Object.entries(CATALOG_SUB_LABEL_FALLBACK).find(([, label]) => label === category.name);
  return match?.[0];
};

const isWaterTreatmentCategory = (category: CategoryOption) => {
  const slug = getCategorySlug(category);
  return slug === "water_treatment" || category.name === "수처리 필터";
};

const isWaterSubCategory = (category: CategoryOption) => {
  const slug = getCategorySlug(category);
  if (slug) return (WATER_SUB_SLUGS as readonly string[]).includes(slug);
  return WATER_SUB_LABELS.has(category.name);
};

const filterCategoryOptions = (categories: CategoryOption[]) =>
  categories.filter((category) => !isWaterTreatmentCategory(category));

const createEmptySpecItem = (): SpecItemInput => ({
  title: "",
  content: "",
});

const sanitizeSpecItems = (items: SpecItemInput[]) =>
  items
    .map((item) => ({
      title: item.title.trim(),
      content: item.content.trim(),
    }))
    .filter((item) => item.title || item.content)
    .slice(0, MAX_SPEC_ITEMS);

const buildLegacySpecHtml = (items: SpecItemInput[]) =>
  sanitizeSpecItems(items)
    .map(
      (item) =>
        `<p><strong>${item.title || "스펙"}</strong>${item.content ? `: ${item.content}` : ""}</p>`,
    )
    .join("");

const buildLegacyContentHtml = (sections: Array<{ title: string; html: string }>) =>
  sections
    .filter(({ html }) => html.trim())
    .map(({ title, html }) => `<h3>${title}</h3>${html}`)
    .join("");

export const AdminProductCreateForm = ({ categories, action }: AdminProductCreateFormProps) => {
  const [state, formAction] = useActionState(action, { error: null });
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const [specItems, setSpecItems] = useState<SpecItemInput[]>([]);
  const [overviewHtml, setOverviewHtml] = useState("");
  const [technologyHtml, setTechnologyHtml] = useState("");
  const [applicationHtml, setApplicationHtml] = useState("");
  const [thumbnailMode, setThumbnailMode] = useState<"file" | "url">("file");
  const [additionalMode, setAdditionalMode] = useState<"file" | "url">("file");
  const [additionalUrlInputs, setAdditionalUrlInputs] = useState([""]);
  const [additionalFileInputKeys, setAdditionalFileInputKeys] = useState([0]);
  const [isConvertingImages, setIsConvertingImages] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const addSpecItem = () => {
    setSpecItems((prev) => (prev.length >= MAX_SPEC_ITEMS ? prev : [...prev, createEmptySpecItem()]));
  };

  const updateSpecItem = (index: number, field: keyof SpecItemInput, value: string) => {
    setSpecItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const removeSpecItem = (index: number) => {
    setSpecItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const categoryOptions = filterCategoryOptions(categories);
  const selectedCategory = categoryOptions.find((category) => category.id === categoryId);
  const isWaterSubProduct = selectedCategory ? isWaterSubCategory(selectedCategory) : false;

  const serializedSpecItems = isWaterSubProduct ? "[]" : JSON.stringify(sanitizeSpecItems(specItems));
  const legacySpecHtml = isWaterSubProduct ? "" : buildLegacySpecHtml(specItems);
  const legacyContentHtml = isWaterSubProduct
    ? ""
    : buildLegacyContentHtml([
        { title: "제품 개요", html: overviewHtml },
        { title: "핵심 기술 및 특장점", html: technologyHtml },
        { title: "주요 적용 공정", html: applicationHtml },
      ]);

  const addAdditionalUrlInput = () => {
    setAdditionalUrlInputs((prev) => [...prev, ""]);
  };

  const updateAdditionalUrlInput = (index: number, value: string) => {
    setAdditionalUrlInputs((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const removeAdditionalUrlInput = (index: number) => {
    setAdditionalUrlInputs((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const addAdditionalFileInput = () => {
    setAdditionalFileInputKeys((prev) => [...prev, prev.length > 0 ? Math.max(...prev) + 1 : 0]);
  };

  const removeAdditionalFileInput = (key: number) => {
    setAdditionalFileInputKeys((prev) => (prev.length === 1 ? prev : prev.filter((item) => item !== key)));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImageUploadError(null);
    setIsConvertingImages(true);

    try {
      let formData = new FormData(event.currentTarget);
      formData = await convertFormDataImagesToWebP(formData, ADMIN_IMAGE_UPLOAD_FIELDS);
      const description = String(formData.get("description") ?? "");
      formData.set("description", normalizeDescriptionForSave(description));
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

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-5 rounded-2xl border border-border p-5">
      <section className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          제품명 <span className="text-red-500">*</span>
          <input
            name="name"
            required
            className="h-10 rounded-md border border-border bg-background px-3 py-2"
            placeholder="제품명을 입력하세요"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          카테고리 <span className="text-red-500">*</span>
          <select
            name="category_id"
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="" disabled>
              서브카테고리를 선택하세요
            </option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <label className="flex flex-col gap-1 text-sm">
        간단설명
        <textarea
          name="description"
          rows={3}
          className="rounded-md border border-border bg-background px-3 py-2"
          placeholder="간단한 소개 문구를 입력하세요"
        />
      </label>

      {isWaterSubProduct && (
        <>
          <input type="hidden" name="is_published" value="on" />
          <input type="hidden" name="sort_order" value="0" />
        </>
      )}

      <input type="hidden" name="spec_items" value={serializedSpecItems} />
      <input type="hidden" name="spec" value={legacySpecHtml} />
      <input type="hidden" name="content" value={legacyContentHtml} />
      <input type="hidden" name="content_overview" value={isWaterSubProduct ? "" : overviewHtml} />
      <input type="hidden" name="content_technology" value={isWaterSubProduct ? "" : technologyHtml} />
      <input type="hidden" name="content_application" value={isWaterSubProduct ? "" : applicationHtml} />

      {!isWaterSubProduct && (
      <section className="glass-card space-y-4 rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <Wrench size={16} />
              스펙
            </p>
            <p className="mt-1 text-xs text-muted-foreground">제목과 내용을 최대 6개까지 입력할 수 있습니다.</p>
          </div>
          <button
            type="button"
            onClick={addSpecItem}
            disabled={specItems.length >= MAX_SPEC_ITEMS}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            스펙 추가
          </button>
        </div>
        {specItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            아직 추가된 스펙이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {specItems.map((item, index) => (
              <div key={`spec-item-${index}`} className="grid gap-3 rounded-xl border border-border bg-background/70 p-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={item.title}
                  onChange={(event) => updateSpecItem(index, "title", event.target.value)}
                  placeholder="예: 처리 풍량"
                  className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={item.content}
                  onChange={(event) => updateSpecItem(index, "content", event.target.value)}
                  placeholder="예: 1,200 CMH"
                  className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeSpecItem(index)}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                  aria-label={`스펙 ${index + 1} 삭제`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      {!isWaterSubProduct && (
      <section className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked className="h-4 w-4" />
          공개 상태
        </label>
        <label className="flex flex-col gap-1 text-sm">
          정렬순서
          <input
            type="number"
            name="sort_order"
            defaultValue={0}
            className="rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
      </section>
      )}

      <section className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">대표 이미지</p>
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
            placeholder="https://example.com/thumbnail.jpg"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">추가 이미지</p>
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
              <div key={`additional-file-${key}`} className="flex gap-2">
                <input
                  type="file"
                  name="additional_image_files"
                  accept={ADMIN_IMAGE_ACCEPT}
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
            {additionalUrlInputs.map((value, index) => (
              <div key={`additional-url-${index}`} className="flex gap-2">
                <input
                  name="additional_image_urls"
                  value={value}
                  onChange={(event) => updateAdditionalUrlInput(index, event.target.value)}
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

      {!isWaterSubProduct && (
      <section className="space-y-5">
        <label className="flex flex-col gap-2 text-sm">
          <span className="inline-flex items-center gap-2 font-medium text-foreground">
            <FileText size={16} />
            제품 개요
          </span>
          <RichTextEditor
            value={overviewHtml}
            onChange={setOverviewHtml}
            placeholder="<p>제품 개요를 입력하세요.</p>"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="inline-flex items-center gap-2 font-medium text-foreground">
            <Wrench size={16} />
            핵심 기술 및 특장점
          </span>
          <RichTextEditor
            value={technologyHtml}
            onChange={setTechnologyHtml}
            placeholder="<p>핵심 기술과 특장점을 입력하세요.</p>"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="inline-flex items-center gap-2 font-medium text-foreground">
            <FileText size={16} />
            주요 적용 공정
          </span>
          <RichTextEditor
            value={applicationHtml}
            onChange={setApplicationHtml}
            placeholder="<p>주요 적용 공정을 입력하세요.</p>"
          />
        </label>
      </section>
      )}

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {imageUploadError && <p className="text-sm text-red-500">{imageUploadError}</p>}

      <button
        type="submit"
        disabled={isPending || isConvertingImages}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        <Save size={15} />
        {isConvertingImages ? "이미지 변환 중..." : isPending ? "저장 중..." : "제품 저장"}
      </button>
    </form>
  );
};
