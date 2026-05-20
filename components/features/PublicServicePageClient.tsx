"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const selectedCase = useMemo(
    () => cases.find((serviceCase) => serviceCase.id === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  );
  const selectedSlides = selectedCase?.slides ?? [];
  const currentSlide = selectedSlides[currentSlideIndex] ?? null;

  useEffect(() => {
    if (!selectedCase) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCaseId(null);
        setCurrentSlideIndex(0);
      }

      if (selectedSlides.length <= 1) return;

      if (event.key === "ArrowLeft") {
        setCurrentSlideIndex((prev) => (prev === 0 ? selectedSlides.length - 1 : prev - 1));
      }

      if (event.key === "ArrowRight") {
        setCurrentSlideIndex((prev) => (prev === selectedSlides.length - 1 ? 0 : prev + 1));
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCase, selectedSlides.length]);

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
    setCurrentSlideIndex((prev) => (prev === 0 ? selectedSlides.length - 1 : prev - 1));
  };

  const showNextSlide = () => {
    if (selectedSlides.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev === selectedSlides.length - 1 ? 0 : prev + 1));
  };

  const showPreviousSlideClamped = () => {
    if (selectedSlides.length <= 1) return;
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const showNextSlideClamped = () => {
    if (selectedSlides.length <= 1) return;
    setCurrentSlideIndex((prev) => Math.min(selectedSlides.length - 1, prev + 1));
  };

  const handleSlideTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleSlideTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const touchEndX = event.changedTouches[0]?.clientX;
    const touchEndY = event.changedTouches[0]?.clientY;
    if (touchEndX === undefined || touchEndY === undefined) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    event.stopPropagation();

    if (deltaX > 0) {
      showPreviousSlideClamped();
      return;
    }

    showNextSlideClamped();
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
                    className="glass-card relative flex min-h-[220px] flex-col items-center rounded-2xl border border-border bg-background px-5 py-6 text-center shadow-sm transition-transform duration-200 hover:-translate-y-1 md:px-6"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-primary">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                      STEP {index + 1}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8"
          onClick={closeCaseModal}
        >
          <div
            className="relative flex h-[85dvh] max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-background shadow-2xl"
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

            <div
              className="relative min-h-0 flex-1 overflow-hidden rounded-t-3xl touch-pan-y"
              onTouchStart={handleSlideTouchStart}
              onTouchEnd={handleSlideTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSlide.url}
                alt={selectedCase.title}
                className="absolute inset-0 h-full w-full object-cover"
              />

              {selectedSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousSlide}
                    className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 md:inline-flex"
                    aria-label="이전 이미지"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextSlide}
                    className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 md:inline-flex"
                    aria-label="다음 이미지"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 pb-4 pt-10 md:hidden">
                    {selectedSlides.map((slide, index) => (
                      <button
                        key={`${slide.url}-${index}`}
                        type="button"
                        onClick={() => setCurrentSlideIndex(index)}
                        className={`rounded-full transition-all ${
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
