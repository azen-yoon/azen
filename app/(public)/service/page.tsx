import { PublicServicePageClient } from "@/components/features/PublicServicePageClient";
import { createStaticClient } from "@/lib/supabase/static";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "교체·시공 사례",
  description:
    "AZEN의 필터 교체·시공 프로젝트 사례를 확인하세요. 현장 맞춤 설계부터 설치, 사후 관리까지 검증된 실적을 제공합니다.",
  keywords: ["AZEN", "필터 교체", "필터 시공", "교체 시공", "산업용 필터", "시공 사례"],
  path: "/service",
});

export const revalidate = 300;

interface ServiceCaseRow {
  id: string;
  title: string;
  thumbnail_url: string | null;
  thumbnail_caption: string | null;
  sort_order: number;
  created_at: string;
  images:
    | Array<{
        id: string;
        url: string;
        caption: string | null;
        sort_order: number;
      }>
    | null;
}

export default async function ServicePage() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("azen_service_cases")
    .select(
      "id, title, thumbnail_url, thumbnail_caption, sort_order, created_at, images:azen_service_case_images(id, url, caption, sort_order)",
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const cases = ((data ?? []) as ServiceCaseRow[]).map((serviceCase) => {
    const additionalSlides = (serviceCase.images ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        url: image.url,
        caption: image.caption,
      }));

    const slides = [
      ...(serviceCase.thumbnail_url
        ? [
            {
              url: serviceCase.thumbnail_url,
              caption: serviceCase.thumbnail_caption,
            },
          ]
        : []),
      ...additionalSlides,
    ];

    return {
      id: serviceCase.id,
      title: serviceCase.title,
      thumbnail_url: serviceCase.thumbnail_url ?? additionalSlides[0]?.url ?? null,
      slides,
    };
  });

  return <PublicServicePageClient cases={cases} />;
}
