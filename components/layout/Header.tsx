"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { FILTER_SUB_SLUGS, PARENT_SLUG_FILTER } from "@/lib/products-catalog";

const filterMenuLinks = [
  { label: "공조기 필터", href: "/products?category=air_handling" },
  { label: "집진기 필터", href: "/products?category=dust_collector" },
  { label: "수처리 필터", href: "/products?category=water_treatment" },
  { label: "기타 품목", href: "/products?category=others" },
];

const navBaseClass =
  "px-2 py-2 text-base underline-offset-[6px] decoration-2 transition-all hover:underline";
const navInactiveClass =
  "font-normal text-foreground/90 decoration-transparent hover:font-semibold hover:decoration-primary dark:text-[#fefbfe]/90 dark:hover:text-[#fefbfe] dark:hover:decoration-[#0A84FF]";
const navActiveClass =
  "font-semibold text-primary decoration-primary dark:text-[#0A84FF] dark:decoration-[#0A84FF]";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"filter" | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const mobileDepthOneClass = "px-2 py-2 text-base";
  const mobileDepthOneInactiveClass = "font-semibold text-foreground dark:text-[#fefbfe]";
  const mobileDepthTwoClass = `${navBaseClass} ${navInactiveClass} pl-4 text-sm`;
  const isFilterCategory =
    category === PARENT_SLUG_FILTER ||
    (!!category && FILTER_SUB_SLUGS.includes(category as (typeof FILTER_SUB_SLUGS)[number]));
  const isAboutActive = pathname === "/about";
  const isPurchaseActive = pathname === "/purchase";
  const isServiceActive = pathname === "/service";
  const isProductsPath = pathname === "/products" || pathname.startsWith("/products/");
  const isFilterActive = isProductsPath && isFilterCategory;
  const getNavClassName = (isActive: boolean) =>
    `${navBaseClass} ${isActive ? navActiveClass : navInactiveClass}`;
  const getMobileDepthOneClassName = (isActive: boolean) =>
    `${mobileDepthOneClass} ${isActive ? navActiveClass : mobileDepthOneInactiveClass}`;

  const handleDropdownBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpenDropdown(null);
    }
  };

  return (
    <header className="glass-header relative z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-[83px] w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="AZEN 홈으로 이동" className="text-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="AZEN" className="h-16 w-auto" />
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            <Link href="/about" className={getNavClassName(isAboutActive)}>
              회사소개
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown("filter")}
              onMouseLeave={() => setOpenDropdown((prev) => (prev === "filter" ? null : prev))}
              onBlur={handleDropdownBlur}
            >
              <Link href="/products?category=filter" className={getNavClassName(isFilterActive)}>
                제품소개
              </Link>
              <div
                id="filter-menu"
                className={`glass-card absolute left-0 top-full z-20 -mt-px min-w-44 rounded-md border border-border bg-background p-1 pt-2 shadow-sm dark:bg-[#1c1c1e] dark:border-white/10 ${
                  openDropdown === "filter"
                    ? "visible opacity-100"
                    : "invisible pointer-events-none opacity-0"
                }`}
              >
                {filterMenuLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={`${navBaseClass} block text-sm`}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/purchase" className={getNavClassName(isPurchaseActive)}>
              구매대행
            </Link>

            <Link href="/service" className={getNavClassName(isServiceActive)}>
              교체시공
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden" aria-hidden>
            <ThemeToggle />
          </div>
          <button
            type="button"
            className="glass-card inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="모바일 메뉴 토글"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute left-0 top-full z-50 w-full md:hidden">
          <div className="border-t border-border bg-white px-4 py-3 shadow-lg dark:bg-[#0b0b0d]">
            <nav className="mx-auto w-full max-w-6xl">
              <div className="flex flex-col gap-2 pb-2">
                <Link
                  href="/about"
                  className={getMobileDepthOneClassName(isAboutActive)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  회사소개
                </Link>
                <Link
                  href="/products?category=filter"
                  className={getMobileDepthOneClassName(isFilterActive)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  제품소개
                </Link>
                {filterMenuLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={mobileDepthTwoClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/purchase"
                  className={getMobileDepthOneClassName(isPurchaseActive)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  구매대행
                </Link>
                <Link
                  href="/service"
                  className={getMobileDepthOneClassName(isServiceActive)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  교체시공
                </Link>
              </div>
            </nav>
          </div>
          <button
            type="button"
            className="h-[calc(100dvh-83px)] w-full bg-black/30 backdrop-blur-[1px]"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="모바일 메뉴 닫기"
          />
        </div>
      )}
    </header>
  );
};
