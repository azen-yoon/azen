import Image from "next/image";
import { Droplets, Factory, LayoutDashboard, ShieldCheck, Wind, Wrench } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "회사소개",
  description:
    "AZEN은 공조기·집진기·수처리 필터 및 산업용 여과 솔루션을 제공하는 전문 기업입니다. 품질 검수, 맞춤 제안, 신속 납품, 사후 기술 지원까지 책임집니다.",
  keywords: ["AZEN", "회사소개", "산업용 필터", "수처리 필터", "공조기 필터", "집진기 필터"],
  path: "/about",
});

export const revalidate = 300;

const businessAreas = [
  {
    title: "공조기 필터",
    description: "실내 공기질 향상과 공조 시스템 보호를 위한 고성능 에어 필터 솔루션입니다.",
    icon: Wind,
    accent: "border-t-[#3b82f6]",
    iconColor: "text-[#3b82f6]",
  },
  {
    title: "집진기 필터",
    description: "산업 현장의 분진과 유해 물질을 효과적으로 제거하여 작업 환경을 개선합니다.",
    icon: Factory,
    accent: "border-t-[#64748b]",
    iconColor: "text-[#64748b]",
  },
  {
    title: "수처리 필터",
    description: "공업용수 및 폐수 처리를 위한 정밀 여과 시스템으로 수자원을 보호합니다.",
    icon: Droplets,
    accent: "border-t-[#06b6d4]",
    iconColor: "text-[#06b6d4]",
  },
  {
    title: "전문 시공",
    description: "필터 시스템의 설계, 설치부터 주기적인 점검과 교체까지 종합 서비스를 제공합니다.",
    icon: Wrench,
    accent: "border-t-[#f97316]",
    iconColor: "text-[#f97316]",
  },
] as const;

const newsItems = [
  {
    label: "Trust",
    icon: ShieldCheck,
    title: "글로벌 스탠다드 품질 검증",
    description:
      "고성능 여재만을 사용하여 출고 전 전수 검사를 원칙으로 합니다. 까다로운 산업 기준을 통과한 제품으로 완벽한 청정도를 약속합니다.",
    image:
      "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80",
    alt: "Industrial quality inspection and verification process",
  },
  {
    label: "Professional",
    icon: Wrench,
    title: "숙련된 전문가의 정밀 진단",
    description:
      "설비의 풍량, 정압, 오염 물질 특성 등을 정밀 분석하여 현장에 최적화된 맞춤형 필터 설계 및 완벽한 시공을 제공합니다.",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    alt: "Industrial engineer performing on-site diagnosis",
  },
  {
    label: "Total Solution",
    icon: LayoutDashboard,
    title: "진단부터 사후 관리까지 원스톱 케어",
    description:
      "전문 시공팀이 직접 교체 및 점검을 진행하며, 정기적인 성능 리포트를 통해 설비의 최적 상태를 지속적으로 관리해 드립니다.",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    alt: "Industrial monitoring and management dashboard concept",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="bg-[#f8f9ff] text-[#0b1c30] dark:bg-black dark:text-[#fefbfe]">
      <section className="relative flex h-[819px] min-h-[600px] items-center justify-center overflow-hidden text-center">
        <div className="absolute inset-0">
          <Image
            src="/hero-factory2.webp"
            alt="Industrial filtration systems in a modern manufacturing facility, clean aesthetic, cool blue lighting"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#213145]/60 dark:bg-black/65" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-12 px-8 md:max-w-[72rem]">
          <h1 className="max-w-4xl text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-white md:max-w-[72rem] md:text-[64px]">
            보이지 않는 곳에서 시작되는 완벽한 환경,
            <br className="hidden md:block" />
            AZEN이 만듭니다
          </h1>
          <p className="max-w-2xl text-balance text-lg leading-[1.6] text-white/90 md:text-[20px]">
            공조기 필터부터 수처리 솔루션까지,
            <br className="hidden md:block" />
            최고 수준의 여과 기술로 산업 현장의 효율성과 안전을 보장합니다.
          </p>
        </div>
      </section>

      <section className="bg-[#f8f9ff] px-8 py-[120px] dark:bg-black">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto -mt-2 max-w-3xl space-y-6 text-center md:max-w-4xl">
            <span className="inline-flex rounded-full bg-[#d3e4fe] px-4 py-1 text-sm font-semibold tracking-[0.05em] text-[#434655] dark:bg-[#1c1c1e] dark:text-[#acaaad]">
              ABOUT AZEN
            </span>
            <h2 className="text-5xl font-semibold leading-[1.2] tracking-[-0.01em] text-[#0b1c30] dark:text-[#fefbfe]">
              전문성과 신뢰의 파트너
            </h2>
            <p className="text-xl leading-[1.6] text-[#434655] dark:text-[#acaaad]">
              AZEN은 첨단 필터 기술력을 바탕으로 다양한 산업 분야에 최적화된 맞춤형 여과 솔루션을 제공합니다.
              <br className="hidden md:block" />
              우리는 단순한 제품 공급을 넘어, 고객의 환경을 분석하고 가장
              효율적인 운영 방안을 제시하는 신뢰할 수 있는 파트너입니다. 엄격한 품질 관리와
              지속적인 연구 개발을 통해 언제나 최고의 성능을 약속합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#eff4ff] px-8 py-[120px] dark:bg-[#0e0e10]">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="mb-12 text-center text-5xl font-semibold leading-[1.2] tracking-[-0.01em] text-[#0b1c30] dark:text-[#fefbfe]">
            Business Areas
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {businessAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article
                  key={area.title}
                  className={`rounded-xl border border-[#d7e2f2] border-t-4 ${area.accent} bg-white p-8 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1 dark:border-white/5 dark:bg-[#1c1c1e]`}
                >
                  <Icon className={`mb-3 h-10 w-10 ${area.iconColor}`} strokeWidth={1.75} aria-hidden />
                  <h3 className="mb-3 text-[32px] font-semibold leading-[1.3] text-[#0b1c30] dark:text-[#fefbfe]">
                    {area.title}
                  </h3>
                  <p className="text-base leading-[1.6] text-[#5a6780] dark:text-[#acaaad]">{area.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9ff] px-8 py-[120px] dark:bg-black">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="mb-4 text-center text-5xl font-semibold leading-[1.2] tracking-[-0.01em] text-[#0b1c30] dark:text-[#fefbfe]">
            Why AZEN?
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-xl leading-[1.6] text-[#434655] dark:text-[#acaaad]">
            AZEN은 최적의 여과 기술로 고객사의 산업 환경적 가치를 극대화합니다.
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {newsItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group overflow-hidden rounded-xl border border-[#d7e2f2] bg-white shadow-[0px_10px_30px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1 dark:border-white/5 dark:bg-[#1c1c1e]"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold leading-none tracking-[0.05em] text-[#1d4ed8] dark:text-[#7fafff]">
                      <Icon className="h-4 w-4" aria-hidden />
                      <span>{item.label}</span>
                    </p>
                    <h3 className="mb-3 line-clamp-2 text-[24px] font-semibold leading-[1.3] text-[#0b1c30] dark:text-[#fefbfe]">
                      {item.title}
                    </h3>
                    <p className="line-clamp-3 text-base leading-[1.6] text-[#5a6780] dark:text-[#acaaad]">
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#eff4ff] px-8 py-[120px] dark:bg-[#0e0e10]">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="mb-12 text-center text-5xl font-semibold leading-[1.2] tracking-[-0.01em] text-[#0b1c30] dark:text-[#fefbfe]">
            오시는 길
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-[#d7e2f2] bg-white shadow-[0px_10px_30px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-[#1c1c1e]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d794.1869601842375!2d127.07047324172939!3d37.22996052942856!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357b459adf24782d%3A0xe7a1373f724abe3a!2z6riw7Z2l7ISc7LKcIOybkO2drOy6kOyKrCDsp4Dsi53sgrDsl4XshLzthLA!5e0!3m2!1sko!2skr!4v1779087636580!5m2!1sko!2skr"
                title="AZEN 오시는 길 구글 지도"
                width="100%"
                height={400}
                style={{ border: 0 }}
                className="block w-full"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="flex flex-col justify-center gap-6 rounded-xl border border-[#d7e2f2] bg-white p-8 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-[#1c1c1e]">
              <div>
                <h3 className="mb-2 text-sm font-semibold tracking-[0.05em] text-[#1d4ed8] dark:text-[#7fafff]">
                  주소
                </h3>
                <p className="text-lg leading-[1.6] text-[#0b1c30] dark:text-[#fefbfe]">
                  경기도 용인시 기흥구 서천로201번길 14 프리미엄원희캐슬 기흥서천 644호
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold tracking-[0.05em] text-[#1d4ed8] dark:text-[#7fafff]">
                  TEL
                </h3>
                <p className="text-lg leading-[1.6] text-[#0b1c30] dark:text-[#fefbfe]">
                  <a href="tel:031-889-0225" className="hover:underline md:hidden">
                    031-889-0225
                  </a>
                  <span className="hidden md:inline">031-889-0225</span>
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold tracking-[0.05em] text-[#1d4ed8] dark:text-[#7fafff]">
                  FAX
                </h3>
                <p className="text-lg leading-[1.6] text-[#0b1c30] dark:text-[#fefbfe]">031-889-0226</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold tracking-[0.05em] text-[#1d4ed8] dark:text-[#7fafff]">
                  E-mail
                </h3>
                <p className="text-lg leading-[1.6] text-[#0b1c30] dark:text-[#fefbfe]">
                  <a href="mailto:azen2023@naver.com" className="hover:underline">
                    azen2023@naver.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
