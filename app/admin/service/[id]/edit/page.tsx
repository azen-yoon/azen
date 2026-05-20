import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminServiceCaseForm } from "@/components/features/AdminServiceCaseForm";
import {
  collectStoragePathsFromUrls,
  createStoragePath,
  isValidUrl,
  parseExistingServiceCaseImageCaptions,
  SERVICE_CASE_IMAGE_BUCKET,
  type ServiceCaseDetail,
  type ServiceCaseImageRow,
} from "@/lib/admin-service-cases";
import {
  deleteManagedAdditionalImage,
  removeReplacedThumbnailFromStorage,
  removeStoragePaths,
} from "@/lib/admin-storage";
import { createClient } from "@/lib/supabase/server";

interface AdminServiceEditPageProps {
  params: Promise<{ id: string }>;
}

interface UpdateServiceCaseFormState {
  error: string | null;
}

export default async function AdminServiceEditPage({ params }: AdminServiceEditPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: serviceCase }, { data: images }] = await Promise.all([
    supabase
      .from("azen_service_cases")
      .select("id, title, thumbnail_url, thumbnail_caption, is_published, sort_order")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("azen_service_case_images")
      .select("id, url, caption, sort_order")
      .eq("case_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!serviceCase) {
    redirect("/admin/service");
  }

  const caseDetail = serviceCase as ServiceCaseDetail;
  const caseImages = (images ?? []) as ServiceCaseImageRow[];

  const updateServiceCaseAction = async (
    _: UpdateServiceCaseFormState,
    formData: FormData,
  ): Promise<UpdateServiceCaseFormState> => {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const thumbnailCaption = String(formData.get("thumbnail_caption") ?? "").trim();
    const isPublished = formData.get("is_published") === "on";
    const sortOrder = Number(String(formData.get("sort_order") ?? "0")) || 0;
    const thumbnailMode = String(formData.get("thumbnail_mode") ?? "file");
    const additionalMode = String(formData.get("additional_mode") ?? "file");

    if (!title) {
      return { error: "제목을 입력해주세요." };
    }

    const actionClient = await createClient();
    const previousThumbnailUrl = caseDetail.thumbnail_url;
    let nextThumbnailUrl: string | null = caseDetail.thumbnail_url;

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
          .from(SERVICE_CASE_IMAGE_BUCKET)
          .upload(thumbnailPath, thumbnailFile, {
            contentType: thumbnailFile.type || "image/jpeg",
            upsert: false,
          });
        if (uploadError) {
          return { error: `대표 이미지 업로드에 실패했습니다: ${uploadError.message}` };
        }
        const { data } = actionClient.storage.from(SERVICE_CASE_IMAGE_BUCKET).getPublicUrl(thumbnailPath);
        nextThumbnailUrl = data.publicUrl;
      }
    }

    const { error: updateError } = await actionClient
      .from("azen_service_cases")
      .update({
        title,
        thumbnail_url: nextThumbnailUrl,
        thumbnail_caption: thumbnailCaption || null,
        is_published: isPublished,
        sort_order: sortOrder,
      })
      .eq("id", id);

    if (updateError) {
      return { error: `시공사례 수정에 실패했습니다: ${updateError.message}` };
    }

    const { error: thumbnailCleanupError } = await removeReplacedThumbnailFromStorage(
      actionClient,
      previousThumbnailUrl,
      nextThumbnailUrl,
      SERVICE_CASE_IMAGE_BUCKET,
    );
    if (thumbnailCleanupError) {
      return { error: `이전 대표 이미지 Storage 삭제에 실패했습니다: ${thumbnailCleanupError}` };
    }

    const captionUpdates = parseExistingServiceCaseImageCaptions(formData.get("existing_image_captions_json"));
    const { data: currentImages, error: fetchImagesError } = await actionClient
      .from("azen_service_case_images")
      .select("id, caption")
      .eq("case_id", id);

    if (fetchImagesError) {
      return { error: `기존 이미지 조회에 실패했습니다: ${fetchImagesError.message}` };
    }

    for (const image of currentImages ?? []) {
      if (!(image.id in captionUpdates)) {
        continue;
      }

      const nextCaption = captionUpdates[image.id] || null;
      const currentCaption = typeof image.caption === "string" ? image.caption.trim() : null;
      if ((currentCaption ?? "") === (nextCaption ?? "")) {
        continue;
      }

      const { data: updatedImage, error: captionUpdateError } = await actionClient
        .from("azen_service_case_images")
        .update({ caption: nextCaption })
        .eq("id", image.id)
        .eq("case_id", id)
        .select("id")
        .maybeSingle();

      if (captionUpdateError) {
        return { error: `기존 이미지 캡션 수정에 실패했습니다: ${captionUpdateError.message}` };
      }

      if (!updatedImage) {
        return {
          error:
            "기존 이미지 캡션 수정에 실패했습니다. Supabase SQL Editor에서 `supabase/admin-011-service-case-images-update-rls.sql`을 실행해 UPDATE RLS 정책을 추가해주세요.",
        };
      }
    }

    const lastSortOrder = caseImages.at(-1)?.sort_order ?? -1;
    const additionalRows: Array<{ case_id: string; url: string; caption: string | null; sort_order: number }> = [];

    if (additionalMode === "url") {
      const urls = formData.getAll("additional_image_urls").map((value) => String(value).trim());
      const captions = formData.getAll("additional_image_url_captions").map((value) => String(value).trim());

      for (const [index, url] of urls.entries()) {
        if (!url) continue;
        if (!isValidUrl(url)) {
          return { error: `추가 이미지 URL(${index + 1}번째) 형식이 올바르지 않습니다.` };
        }
        additionalRows.push({
          case_id: id,
          url,
          caption: captions[index] || null,
          sort_order: lastSortOrder + additionalRows.length + 1,
        });
      }
    } else {
      const files = formData
        .getAll("additional_image_files")
        .filter((value): value is File => value instanceof File && value.size > 0);
      const captions = formData.getAll("additional_image_captions").map((value) => String(value).trim());

      for (const [index, file] of files.entries()) {
        const path = createStoragePath(`${id}/gallery`, file.name, index);
        const { error: uploadError } = await actionClient.storage.from(SERVICE_CASE_IMAGE_BUCKET).upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (uploadError) {
          return { error: `추가 이미지 업로드에 실패했습니다: ${uploadError.message}` };
        }
        const { data } = actionClient.storage.from(SERVICE_CASE_IMAGE_BUCKET).getPublicUrl(path);
        additionalRows.push({
          case_id: id,
          url: data.publicUrl,
          caption: captions[index] || null,
          sort_order: lastSortOrder + index + 1,
        });
      }
    }

    if (additionalRows.length > 0) {
      const { error: imageInsertError } = await actionClient.from("azen_service_case_images").insert(additionalRows);
      if (imageInsertError) {
        return { error: `추가 이미지 저장에 실패했습니다: ${imageInsertError.message}` };
      }
    }

    revalidatePath(`/admin/service/${id}/edit`);
    redirect(`/admin/service/${id}/edit?toast=updated`);
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
      table: "azen_service_case_images",
      parentColumn: "case_id",
      parentId: id,
      imageId,
      bucket: SERVICE_CASE_IMAGE_BUCKET,
    });

    if (result.error) {
      return result;
    }

    revalidatePath(`/admin/service/${id}/edit`);
    return { error: null };
  };

  const deleteCaseAction = async (formData: FormData) => {
    "use server";

    void formData;
    const actionClient = await createClient();
    const [{ data: caseRow }, { data: imageRows }] = await Promise.all([
      actionClient.from("azen_service_cases").select("thumbnail_url").eq("id", id).maybeSingle(),
      actionClient.from("azen_service_case_images").select("url").eq("case_id", id),
    ]);

    const storagePaths = collectStoragePathsFromUrls([
      caseRow?.thumbnail_url ?? null,
      ...(imageRows ?? []).map((image) => image.url),
    ]);

    if (storagePaths.length > 0) {
      const { error: storageError } = await removeStoragePaths(
        actionClient,
        storagePaths,
        SERVICE_CASE_IMAGE_BUCKET,
      );
      if (storageError) {
        throw new Error(`Storage 파일 삭제에 실패했습니다: ${storageError}`);
      }
    }

    const { error: imagesDeleteError } = await actionClient
      .from("azen_service_case_images")
      .delete()
      .eq("case_id", id);
    if (imagesDeleteError) {
      throw new Error(`추가 이미지 DB 삭제에 실패했습니다: ${imagesDeleteError.message}`);
    }

    const { error: caseDeleteError } = await actionClient.from("azen_service_cases").delete().eq("id", id);
    if (caseDeleteError) {
      throw new Error(`시공사례 DB 삭제에 실패했습니다: ${caseDeleteError.message}`);
    }

    redirect("/admin/service?toast=deleted");
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <p className="text-sm text-muted-foreground">기존 시공사례 정보를 수정하고 이미지를 관리할 수 있습니다.</p>
      <AdminServiceCaseForm
        mode="edit"
        initialCase={caseDetail}
        existingImages={caseImages}
        action={updateServiceCaseAction}
        deleteImageAction={deleteImageAction}
        deleteCaseAction={deleteCaseAction}
      />
    </main>
  );
}
