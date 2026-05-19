import { Mail, Package, Phone, TrendingDown, Truck, User } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "구매대행",
  description:
    "국내외 전기부품·제어기기·자동화 부품 등 산업 소모품 구매대행 서비스. 견적 비교부터 통관·배송까지 원스톱으로 지원합니다.",
  keywords: ["AZEN", "구매대행", "전기부품", "산업 소모품", "수입 대행", "통관"],
  path: "/purchase",
});

const featureCards = [
  {
    icon: Package,
    title: "폭넓은 대행 품목",
    description: "국내외 전기부품, 제어기기, 자동화 부품 및 기타 산업 소모품 전반",
  },
  {
    icon: TrendingDown,
    title: "원가 절감",
    description: "최적의 공급선 확보를 통한 비용 절감 및 복잡한 수입 절차 일괄 대행",
  },
  {
    icon: Truck,
    title: "원스톱 서비스",
    description: "견적 비교부터 통관, 배송까지 한 번에 해결",
  },
] as const;

export default function PurchasePage() {
  return (
    <main className="bg-background text-foreground">
      <section
        className="relative w-full overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/elec.webp')", minHeight: "300px" }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex min-h-[300px] items-end">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <h1 className="text-3xl font-bold text-white md:text-4xl">구매대행</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80 md:text-base">
              필요하신 모든 전기부품 및 산업용 기자재를 빠르고 정확하게 찾아드립니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-foreground">AZEN 제품 구매대행</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground md:text-lg">
            견적 비교부터 통관, 배송까지 원스톱으로 해결해 드립니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="rounded-2xl bg-muted p-8">
                <Icon className="h-10 w-10 text-primary" aria-hidden />
                <h3 className="mt-4 text-lg font-bold text-foreground">{card.title}</h3>
                <p className="mt-3 text-base leading-7 text-muted-foreground">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 text-center md:px-6">
        <hr className="border-border" />
        <h2 className="mb-4 mt-8 text-lg font-bold text-foreground">구매 및 견적 문의</h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="text-sm text-muted-foreground">담당자</span>
            <span className="font-semibold text-foreground">이황범 부장</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="text-sm text-muted-foreground">전화</span>
            <a href="tel:010-4803-6730" className="font-semibold text-primary hover:underline md:hidden">
              010-4803-6730
            </a>
            <span className="hidden font-semibold text-foreground md:inline">010-4803-6730</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="text-sm text-muted-foreground">이메일</span>
            <a href="mailto:bum2002@kakao.com" className="font-semibold text-primary hover:underline">
              bum2002@kakao.com
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
