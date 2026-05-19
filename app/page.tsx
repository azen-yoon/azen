import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { Factory, ShieldCheck, Truck, Wrench } from "lucide-react";
import { HomeHeroPhoneCtas } from "@/components/features/HomeHeroPhoneCtas";
import { HomeProductsCarousel } from "@/components/features/HomeProductsCarousel";
import { createStaticClient } from "@/lib/supabase/static";
import { buildOpenGraph, DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: buildOpenGraph({
    title: SITE_NAME,
    url: SITE_URL,
  }),
};

export const revalidate = 300;

const featureCards = [
  {
    title: "산업 현장 맞춤 제안",
    description: "업종별 오염원과 설비 특성을 반영한 맞춤형 제품 추천",
    icon: Factory,
    image:
      "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "품질 검수 프로세스",
    description: "출고 전 규격/성능 검수로 안정적인 운영 지원",
    icon: ShieldCheck,
    image:
      "https://images.unsplash.com/photo-1581092583537-20d51b4b4f1b?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "신속한 납품",
    description: "요청 일정에 맞춰 전국 단위 납품 대응",
    icon: Truck,
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "사후 기술 지원",
    description: "설치 이후 교체 주기와 운영 이슈까지 지속 관리",
    icon: Wrench,
    image:
      "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1600&q=80",
  },
];

const getMainCarousel = unstable_cache(
  async () => {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("azen_main_carousel")
      .select("slot, product:azen_products(id, name, description, thumbnail_url)")
      .not("product_id", "is", null)
      .order("slot", { ascending: true });
    return data ?? [];
  },
  ["main-carousel"],
  { revalidate: 60 },
);

export default async function Home() {
  const slotRows = await getMainCarousel();

  const productCards = slotRows
    .map((row) => {
      const product = Array.isArray(row.product) ? row.product[0] : row.product;
      if (!product) return null;
      return {
        id: product.id as string,
        title: product.name as string,
        description: (product.description ?? null) as string | null,
        image: (product.thumbnail_url ?? null) as string | null,
      };
    })
    .filter(
      (
        value,
      ): value is {
        id: string;
        title: string;
        description: string | null;
        image: string | null;
      } => Boolean(value),
    );

  return (
    <>
      <section
        className="relative w-full overflow-hidden bg-cover bg-center min-h-[520px] md:min-h-[600px]"
        style={{
          backgroundImage: "url('/hero-main.webp')",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 mx-auto flex min-h-[520px] w-full max-w-6xl items-start px-4 pt-20 pb-14 md:min-h-[600px] md:items-center md:px-6 md:py-24">
          <div className="max-w-2xl space-y-4 lg:space-y-6">
            <p className="inline-flex items-center rounded-full border border-[#2b4f86] bg-[#13223a]/90 px-5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#82aef5] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)] dark:border-[#2b4f86] dark:bg-[#13223a]/90 dark:text-[#82aef5]">
              AZEN INDUSTRIAL SOLUTIONS
            </p>
            <h1 className="font-english text-3xl font-bold leading-tight text-white md:text-5xl">
              <span className="text-primary dark:text-[#0A84FF]">멈추지 않는 공정,</span>
              <br />
              빈틈없는 필터 케어 솔루션
            </h1>
            <p className="max-w-xl text-sm leading-7 text-white/80 md:text-base">
              적기 수급부터 정밀 시공까지, 산업용 필터 관리의 모든 과정을 책임집니다. 집진기,
              유공압 부품 등 현장에 필요한 최상의 파츠를 가장 빠르게 연결해 드립니다.
            </p>
            <HomeHeroPhoneCtas />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl space-y-20 px-4 pt-12 pb-20 md:px-6 md:py-16 lg:space-y-32 lg:pt-24 lg:pb-32">
        <section className="space-y-6 lg:space-y-8">
          <HomeProductsCarousel cards={productCards} />
        </section>

        <section className="space-y-6 lg:space-y-8">
        <h2 className="text-2xl font-semibold text-foreground">Core Values</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href="/about"
                className="glass-card group relative h-[14rem] overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] md:h-[28rem]"
              >
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 transition-colors duration-300 group-hover:bg-black/25" />
                <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-6">
                  <Icon className="mb-2 h-5 w-5 text-white transition-transform duration-300 group-hover:translate-x-1" />
                  <h3 className="mb-1 text-sm font-semibold text-white md:text-base">{feature.title}</h3>
                  <p className="text-xs text-white/80 md:text-sm">{feature.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
        </section>
      </main>
    </>
  );
}
