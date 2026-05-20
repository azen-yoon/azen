# feedback.md — passes: true 항목 코드 검수 결과

**날짜:** 2026-05-20  
**방법:** 파일 읽기 전용 (브라우저/서버 기동 없음)  
**대상:** feature_list/ 전체 passes: true 항목

---

## 검수 결과 요약

| 카테고리 | 이상 없음 | 문제 발견 |
|---------|----------|---------|
| INIT-000~003 | ✓ | |
| AUTH-001 | ✓ | |
| UX-001 | ✓ | |
| MEDIA-001 | ✓ | |
| EDITOR-001~003 | ✓ | |
| PAGE-001~004, PAGE-006 | ✓ | |
| SEO-001~003 | ✓ | |
| ADMIN-001~005 | ✓ | |
| **ADMIN-006** | | ⚠ RLS |
| **ADMIN-007** | | ⚠ RLS + 스키마 누락 |
| ADMIN-008~010 | ✓ | |
| **ADMIN-011** | | ⚠ RLS 과잉 허용 |
| PRODUCT-001, 003~005 | ✓ | |
| **PAGE-005** | | ⚠ 에러 핸들링 |
| **ADMIN-002/003, ADMIN-007** | | ⚠ 중복 코드 |

---

## [ADMIN-006] 메인 관리 — 캐러셀 제품 선택

**결과:** RLS 경고

### 문제 1: `azen_main_carousel` INSERT / DELETE 정책 없음

`supabase/init-002.sql`에서 `azen_main_carousel`에 적용된 정책:
- SELECT: ✓ `"azen 캐러셀 공개 조회"` (`using (true)`)
- UPDATE: ✓ `"azen 관리자 캐러셀 수정"` (`auth.uid() is not null`)
- INSERT: ❌ 정책 없음
- DELETE: ❌ 정책 없음

시드 SQL이 슬롯 1~6을 미리 insert하므로 upsert는 항상 UPDATE로 동작해 현재는 실질적 영향 없음.  
단, 슬롯 행이 삭제되거나 슬롯 수가 확장될 경우 upsert INSERT 시도 → RLS 에러.

### 문제 2: UPDATE 정책 admin role 미검사

```sql
-- 현재
using (auth.uid() is not null)
-- 다른 테이블 패턴
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
```

모든 인증된 유저(admin이 아닌 유저 포함)가 캐러셀 슬롯을 수정할 수 있는 상태.  
실제 admin 계정 외 로그인 경로가 없으면 무해하지만 정책 불일치.

### 재작업 지시
Supabase SQL Editor에서 아래 실행:
```sql
-- INSERT 정책 추가
create policy "azen 관리자 캐러셀 등록"
on public.azen_main_carousel
for insert
to authenticated
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- DELETE 정책 추가
create policy "azen 관리자 캐러셀 삭제"
on public.azen_main_carousel
for delete
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- UPDATE 정책 교체 (admin role 조건으로)
drop policy "azen 관리자 캐러셀 수정" on public.azen_main_carousel;
create policy "azen 관리자 캐러셀 수정"
on public.azen_main_carousel
for update
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');
```

---

## [ADMIN-007] 시공사례 관리 — 등록/수정/삭제

**결과:** RLS 경고 + 스키마 파일 누락

### 문제 1: `azen_service_cases` / `azen_service_case_images` 테이블 생성 SQL 없음

`supabase/` 폴더에 해당 테이블 DDL·RLS SQL 파일이 없음.  
INIT-002처럼 SQL 파일로 버전 관리되어야 스키마 재현 가능.

### 재작업 지시
`supabase/admin-007-service-cases-schema.sql` 파일 신규 생성 후 실제 Supabase에 적용된 DDL + RLS 4개씩을 문서화할 것. (참고: INIT-002 구조)

---

## [ADMIN-011] 시공사례 추가 이미지 캡션 인라인 수정

**결과:** RLS 과잉 허용

### 문제: `azen_service_case_images` UPDATE 정책이 admin 미한정

`supabase/admin-011-service-case-images-update-rls.sql`:
```sql
CREATE POLICY "Authenticated users can update service case images"
  ON public.azen_service_case_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

모든 인증된 유저가 `azen_service_case_images` 행을 UPDATE 가능 (admin only가 아님).  
다른 테이블의 `admin_write_*` 패턴과 불일치.

### 재작업 지시
Supabase SQL Editor에서 정책 교체:
```sql
drop policy "Authenticated users can update service case images" on public.azen_service_case_images;
create policy "admin_update_azen_service_case_images"
on public.azen_service_case_images
for update
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');
```

---

## [ADMIN-003 / ADMIN-009] 이미지 삭제 — 에러 메시지 손실 버그

**결과:** 에러 핸들링 버그

**파일:** `lib/admin-storage.ts:103~106`

```typescript
// removeStoragePaths 리턴 타입: Promise<{ error: string | null }>
const { error: storageError } = await removeStoragePaths(supabase, [storagePath], bucket);
if (storageError) {
  // storageError는 string — .message는 undefined → 에러 메시지 손실
  return { error: `Storage 파일 삭제에 실패했습니다: ${storageError.message}` };
}
```

`removeStoragePaths`가 `{ error: string | null }` 을 반환하므로 `storageError`는 string.  
`.message`를 접근하면 런타임에 `undefined`가 되어 실제 에러 내용이 사라짐.

### 재작업 지시
`lib/admin-storage.ts:105` 수정:
```typescript
// 변경 전
return { error: `Storage 파일 삭제에 실패했습니다: ${storageError.message}` };
// 변경 후
return { error: `Storage 파일 삭제에 실패했습니다: ${storageError}` };
```

---

## [PAGE-005] 교체시공 페이지 — 시공사례 쿼리 에러 무시

**결과:** 에러 핸들링 누락

**파일:** `app/(public)/service/page.tsx:34~41`

```typescript
// error 미구조분해
const { data } = await supabase
    .from("azen_service_cases")
    .select(...)
    .eq("is_published", true)
    ...
```

쿼리 실패 시 `data = null` → `cases = []` → 빈 Success Cases 섹션 표시.  
에러 원인을 로그로도 남기지 않음.

### 재작업 지시
```typescript
// 변경 전
const { data } = await supabase.from(...).select(...)...
// 변경 후
const { data, error } = await supabase.from(...).select(...)...
if (error) {
  console.error("[ServicePage] azen_service_cases 조회 실패:", error.message);
}
```

---

## [ADMIN-002 / ADMIN-003] 유틸 함수 중복 정의

**결과:** 불필요한 중복 코드

**중복 위치:**

| 함수 | new/page.tsx | [id]/edit/page.tsx | lib/admin-service-cases.ts |
|------|:---:|:---:|:---:|
| `isValidUrl` | ✓ | ✓ | ✓ (3중) |
| `createStoragePath` | ✓ | ✓ | ✓ (3중) |
| `parseSpecItems` | ✓ | ✓ | — |
| `categoryOrderKeywords` | ✓ | ✓ | — |
| `getCategoryOrderIndex` | ✓ | ✓ | — |

`isValidUrl`, `createStoragePath`는 이미 `lib/admin-service-cases.ts`에 export되어 있으므로 `new/page.tsx`, `[id]/edit/page.tsx`에서 import해서 쓰면 됨.  
`parseSpecItems`, `categoryOrderKeywords`, `getCategoryOrderIndex`는 `lib/admin-products.ts` 등의 공통 파일로 분리 권장.

### 재작업 지시
`app/admin/products/new/page.tsx`와 `app/admin/products/[id]/edit/page.tsx`에서 인라인 정의 제거 후 `lib/admin-service-cases.ts`에서 import:
```typescript
import { isValidUrl, createStoragePath } from "@/lib/admin-service-cases";
```
`parseSpecItems`, `categoryOrderKeywords`, `getCategoryOrderIndex`는 신규 `lib/admin-products.ts`로 추출 후 두 파일에서 import.

---

## 이상 없는 항목

INIT-000, INIT-001, INIT-002, INIT-003, AUTH-001, UX-001, MEDIA-001, EDITOR-001, EDITOR-002, EDITOR-003, PAGE-001, PAGE-002, PAGE-003, PAGE-004, PAGE-006, SEO-001, SEO-002, SEO-003, ADMIN-001, ADMIN-002(로직), ADMIN-003(로직), ADMIN-004, ADMIN-005, ADMIN-008, ADMIN-009(로직), ADMIN-010, PRODUCT-001, PRODUCT-003, PRODUCT-004, PRODUCT-005
