"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

interface ServiceCaseSlide {
  url: string;
  caption: string | null;
}

interface ServiceCaseItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  slides: ServiceCaseSlide[];
}

interface PublicServicePageClientProps {
  cases: ServiceCaseItem[];
}

const processSteps = [
  { title: "현장 진단", description: "점검", icon: Search },
  { title: "보양 작업", description: "오염 차단", icon: ShieldCheck },
  { title: "정밀 탈거", description: "클리닝", icon: Sparkles },
  { title: "정밀 시공", description: "밀착 확인", icon: Wrench },
  { title: "성능 보고", description: "보고서 발행", icon: BarChart3 },
] as const;

const comparisonRows = [
  { feature: "Housing Cleaning", general: "NO", azen: "YES" },
  { feature: "Leak Testing", general: "NO", azen: "YES" },
  { feature: "Post-service Report", general: "NO", azen: "YES" },
] as const;

export const PublicServicePageClient = ({ cases }: PublicServicePageClientProps) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slideScrollRef = useRef<HTMLDivElement>(null);

  const selectedCase = useMemo(
    () => cases.find((serviceCase) => serviceCase.id === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  );
  const selectedSlides = selectedCase?.slides ?? [];
  const currentSlide = selectedSlides[currentSlideIndex] ?? null;

  const scrollToSlide = (index: number) => {
    const container = slideScrollRef.current;
    if (!container || container.clientWidth === 0) return;

    container.scrollTo({
      left: index * container.clientWidth,
      behavior: "smooth",
    });
  };

  const handleGalleryScroll = () => {
    const container = slideScrollRef.current;
    if (!container || container.clientWidth === 0) return;

    const nextIndex = Math.round(container.scrollLeft / container.clientWidth);
    const clampedIndex = Math.max(0, Math.min(selectedSlides.length - 1, nextIndex));

    setCurrentSlideIndex((prev) => (prev === clampedIndex ? prev : clampedIndex));
  };

  useEffect(() => {
    if (!selectedCase) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCaseId(null);
        setCurrentSlideIndex(0);
      }

      if (selectedSlides.length <= 1) return;

      if (event.key === "ArrowLeft") {
        scrollToSlide(currentSlideIndex === 0 ? selectedSlides.length - 1 : currentSlideIndex - 1);
      }

      if (event.key === "ArrowRight") {
        scrollToSlide(currentSlideIndex === selectedSlides.length - 1 ? 0 : currentSlideIndex + 1);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCase, selectedSlides.length, currentSlideIndex]);

  useLayoutEffect(() => {
    const container = slideScrollRef.current;
    if (!container || !selectedCase) return;

    container.scrollLeft = 0;
    setCurrentSlideIndex(0);
  }, [selectedCase, selectedCaseId]);

  const openCaseModal = (serviceCaseId: string) => {
    setSelectedCaseId(serviceCaseId);
    setCurrentSlideIndex(0);
  };

  const closeCaseModal = () => {
    setSelectedCaseId(null);
    setCurrentSlideIndex(0);
  };

  const showPreviousSlide = () => {
    if (selectedSlides.length <= 1) return;
    scrollToSlide(currentSlideIndex === 0 ? selectedSlides.length - 1 : currentSlideIndex - 1);
  };

  const showNextSlide = () => {
    if (selectedSlides.length <= 1) return;
    scrollToSlide(currentSlideIndex === selectedSlides.length - 1 ? 0 : currentSlideIndex + 1);
  };

  return (
    <>
      <main className="bg-background text-foreground">
        <section className="relative flex min-h-[500px] items-center overflow-hidden">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/filter-bg2.webp"
              alt="Modern industrial facility clean room environment with high tech filtration systems"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-white/80">
                PROFESSIONAL SERVICE
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-[-0.03em] text-white md:text-6xl">
                단순 교체를 넘어,
                <br />
                설비의 최적 성능을 복원합니다.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
                AZEN의 전담 시공팀은 미세한 누출까지 차단하는 정밀 시공으로 가장 안전하고 깨끗한
                산업 현장을 약속합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <h2 className="text-center text-3xl font-semibold tracking-[-0.02em] md:text-4xl">Service Process</h2>
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-[4.25rem] hidden h-px bg-border md:block" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {processSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="glass-card relative flex min-h-0 flex-row items-center gap-4 rounded-2xl border border-border bg-background px-4 py-4 shadow-sm transition-transform duration-200 hover:-translate-y-1 md:min-h-[220px] md:flex-col md:items-center md:gap-0 md:px-6 md:py-6 md:text-center"
                  >
                    <div className="flex shrink-0 flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary md:mx-auto md:h-14 md:w-14">
                        <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
                      </div>
                      <p className="mt-2 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground md:mt-4 md:text-xs md:tracking-[0.18em]">
                        STEP {index + 1}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 text-left md:text-center">
                      <h3 className="text-lg font-bold leading-snug md:mt-2 md:text-lg md:font-semibold">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground md:text-sm">{step.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
          <h2 className="text-center text-3xl font-semibold tracking-[-0.02em] md:text-4xl">Why Choose AZEN</h2>
          <div className="glass-card mt-12 overflow-x-auto rounded-2xl border border-border bg-background">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-muted/70">
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Service Feature
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    General Replacement
                  </th>
                  <th className="bg-primary/5 px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    AZEN Professional Service
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-t border-border">
                    <td className="px-4 py-4 font-medium text-foreground">{row.feature}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {row.general}
                      </span>
                    </td>
                    <td className="bg-primary/5 px-4 py-4">
                      <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {row.azen}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
          <h2 className="text-center text-3xl font-semibold tracking-[-0.02em] md:text-4xl">Success Cases</h2>
          {cases.length === 0 ? (
            <div className="glass-card mt-12 rounded-3xl border border-border bg-elevated px-8 py-16 text-center">
              <p className="text-2xl font-semibold text-foreground">등록된 시공사례가 없습니다</p>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((serviceCase) => (
                <button
                  key={serviceCase.id}
                  type="button"
                  onClick={() => openCaseModal(serviceCase.id)}
                  className="glass-card group overflow-hidden rounded-2xl border border-border bg-background text-left transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-elevated">
                    {serviceCase.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={serviceCase.thumbnail_url}
                        alt={serviceCase.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-foreground">{serviceCase.title}</h3>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedCase && currentSlide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeCaseModal}
        >
          <div
            className="relative flex h-[min(85dvh,calc(100dvh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeCaseModal}
              className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              aria-label="모달 닫기"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-t-3xl">
              <div
                ref={slideScrollRef}
                onScroll={handleGalleryScroll}
                className="absolute inset-0 flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:snap-none md:overflow-x-hidden"
              >
                {selectedSlides.map((slide, index) => (
                  <div
                    key={`${slide.url}-${index}`}
                    className="relative h-full min-w-full shrink-0 snap-start snap-always"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.url}
                      alt={selectedCase.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {selectedSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousSlide}
                    className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 md:inline-flex"
                    aria-label="이전 이미지"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextSlide}
                    className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 md:inline-flex"
                    aria-label="다음 이미지"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 pb-4 pt-10 md:hidden">
                    {selectedSlides.map((slide, index) => (
                      <button
                        key={`${slide.url}-${index}`}
                        type="button"
                        onClick={() => scrollToSlide(index)}
                        className={`pointer-events-auto rounded-full transition-all ${
                          index === currentSlideIndex ? "h-2.5 w-6 bg-white" : "h-2.5 w-2.5 bg-white/45"
                        }`}
                        aria-label={`${index + 1}번째 이미지`}
                        aria-current={index === currentSlideIndex ? "true" : undefined}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-foreground">{selectedCase.title}</h3>
                {currentSlide.caption ? <p className="text-sm text-muted-foreground">{currentSlide.caption}</p> : null}
              </div>
              {selectedSlides.length > 1 ? (
                <p className="hidden text-sm font-medium text-muted-foreground md:block">
                  {currentSlideIndex + 1} / {selectedSlides.length}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
