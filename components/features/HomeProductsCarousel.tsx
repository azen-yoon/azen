"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface ProductCard {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
}

interface HomeProductsCarouselProps {
  cards: ProductCard[];
}

export const HomeProductsCarousel = ({ cards }: HomeProductsCarouselProps) => {
  const [startIndex, setStartIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalSwipeRef = useRef(false);
  const isLoopEnabled = cards.length > itemsPerView;

  useEffect(() => {
    const updateItemsPerView = () => {
      setItemsPerView(window.innerWidth < 768 ? 1 : 3);
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  useEffect(() => {
    const loopEnabled = cards.length > itemsPerView;
    if (itemsPerView === 1 || !loopEnabled) return;

    const timer = window.setInterval(() => {
      setStartIndex((prev) => (prev + 1) % cards.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [cards.length, itemsPerView]);

  const trackCards = useMemo(() => {
    if (cards.length === 0) return [];
    if (!isLoopEnabled) return cards;
    return [...cards, ...cards.slice(0, itemsPerView)];
  }, [cards, isLoopEnabled, itemsPerView]);

  const moveCarousel = (direction: "prev" | "next") => {
    if (cards.length === 0 || !isLoopEnabled) return;
    setStartIndex((prev) => {
      if (direction === "next") return (prev + 1) % cards.length;
      return (prev - 1 + cards.length) % cards.length;
    });
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
    isHorizontalSwipeRef.current = false;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const endX = event.changedTouches[0]?.clientX;
    const wasHorizontalSwipe = isHorizontalSwipeRef.current;

    if (endX === undefined || touchStartXRef.current === null) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      isHorizontalSwipeRef.current = false;
      return;
    }

    const deltaX = touchStartXRef.current - endX;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalSwipeRef.current = false;

    if (!wasHorizontalSwipe) return;

    const swipeThreshold = 40;
    if (deltaX > swipeThreshold) moveCarousel("next");
    if (deltaX < -swipeThreshold) moveCarousel("prev");
  };

  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;

    const handleTouchMove = (event: TouchEvent) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      if (!isHorizontalSwipeRef.current) {
        if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }

      if (isHorizontalSwipeRef.current) {
        event.preventDefault();
      }
    };

    node.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => node.removeEventListener("touchmove", handleTouchMove);
  }, []);

  if (cards.length === 0) {
    return (
      <div className="glass-card rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
        노출할 제품이 아직 설정되지 않았습니다.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Products</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveCarousel("prev")}
            className="glass-card rounded-md border border-border bg-background p-2"
            aria-label="이전 제품 카드"
            disabled={!isLoopEnabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => moveCarousel("next")}
            className="glass-card rounded-md border border-border bg-background p-2"
            aria-label="다음 제품 카드"
            disabled={!isLoopEnabled}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={carouselRef}
        className="touch-pan-y overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex gap-4 transition-transform duration-700 ease-out"
          style={{
            transform: isLoopEnabled
              ? itemsPerView === 1
                ? `translateX(calc(-${startIndex} * (88% + 1rem)))`
                : `translateX(calc(-${startIndex * (100 / itemsPerView)}% - ${startIndex * (1 / itemsPerView)}rem))`
              : "translateX(0)",
          }}
        >
          {trackCards.map((card, idx) => (
            <Link
              key={`${card.id}-${idx}`}
              href={`/products/${card.id}`}
              className="glass-card group relative w-[88%] shrink-0 overflow-hidden rounded-lg border border-border bg-background md:w-[calc((100%-2rem)/3)] md:transition-all md:duration-300 md:hover:-translate-y-1 md:hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)]"
            >
              <div className="pointer-events-none absolute inset-0 z-[1] bg-black/10 opacity-0 md:transition-opacity md:duration-300 md:group-hover:opacity-100" />
              <div className="relative h-[22rem] w-full">
                <Image
                  src={card.image ?? "/hero-factory.png"}
                  alt={card.title}
                  fill
                  className="object-cover md:transition-transform md:duration-500 md:group-hover:scale-105"
                />
              </div>
              <div className="relative z-[2] p-5 lg:p-6 dark:bg-[#111114]">
                <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-white">{card.title}</h3>
                <p className="line-clamp-2 min-h-[2.75rem] text-sm leading-[1.375rem] text-muted-foreground dark:text-white/80">
                  {card.description ?? "제품 상세 페이지에서 더 많은 정보를 확인할 수 있습니다."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
