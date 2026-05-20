import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminServiceCaseForm } from "@/components/features/AdminServiceCaseForm";
import { createStoragePath, isValidUrl, SERVICE_CASE_IMAGE_BUCKET } from "@/lib/admin-service-cases";
import { createClient } from "@/lib/supabase/server";

interface CreateServiceCaseFormState {
  error: string | null;
}

export default async function AdminServiceNewPage() {
  const createServiceCaseAction = async (
    _: CreateServiceCaseFormState,
    formData: FormData,
  ): Promise<CreateServiceCaseFormState> => {
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
        const thumbnailPath = createStoragePath("service-cases/thumbnails", thumbnailFile.name);
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
        thumbnailUrl = data.publicUrl;
      }
    }

    const { data: insertedCase, error: insertError } = await actionClient
      .from("azen_service_cases")
      .insert({
        title,
        thumbnail_url: thumbnailUrl,
        thumbnail_caption: thumbnailCaption || null,
        is_published: isPublished,
        sort_order: sortOrder,
      })
      .select("id")
      .single();

    if (insertError || !insertedCase) {
      return { error: `시공사례 저장에 실패했습니다: ${insertError?.message ?? "알 수 없는 오류"}` };
    }

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
          case_id: insertedCase.id,
          url,
          caption: captions[index] || null,
          sort_order: additionalRows.length,
        });
      }
    } else {
      const files = formData
        .getAll("additional_image_files")
        .filter((value): value is File => value instanceof File && value.size > 0);
      const captions = formData.getAll("additional_image_captions").map((value) => String(value).trim());

      for (const [index, file] of files.entries()) {
        const path = createStoragePath(`${insertedCase.id}/gallery`, file.name, index);
        const { error: uploadError } = await actionClient.storage.from(SERVICE_CASE_IMAGE_BUCKET).upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (uploadError) {
          return { error: `추가 이미지 업로드에 실패했습니다: ${uploadError.message}` };
        }
        const { data } = actionClient.storage.from(SERVICE_CASE_IMAGE_BUCKET).getPublicUrl(path);
        additionalRows.push({
          case_id: insertedCase.id,
          url: data.publicUrl,
          caption: captions[index] || null,
          sort_order: index,
        });
      }
    }

    if (additionalRows.length > 0) {
      const { error: imageInsertError } = await actionClient.from("azen_service_case_images").insert(additionalRows);
      if (imageInsertError) {
        return { error: `추가 이미지 저장에 실패했습니다: ${imageInsertError.message}` };
      }
    }

    revalidatePath("/service");
    revalidatePath("/admin/service");
    redirect("/admin/service?toast=created");
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <p className="text-sm text-muted-foreground">
        시공사례 제목과 대표/추가 이미지를 입력하면 관리자 목록에 바로 반영됩니다.
      </p>
      <AdminServiceCaseForm mode="create" action={createServiceCaseAction} />
    </main>
  );
}
