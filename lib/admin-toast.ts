export type AdminToastCode = "created" | "updated" | "deleted";
export type AdminToastScope = "product" | "service" | "default";

const TOAST_MESSAGES: Record<AdminToastScope, Record<AdminToastCode, string>> = {
  product: {
    created: "제품이 등록되었습니다.",
    updated: "제품이 수정되었습니다.",
    deleted: "제품이 삭제되었습니다.",
  },
  service: {
    created: "시공사례가 등록되었습니다.",
    updated: "시공사례가 수정되었습니다.",
    deleted: "시공사례가 삭제되었습니다.",
  },
  default: {
    created: "저장되었습니다.",
    updated: "저장되었습니다.",
    deleted: "삭제되었습니다.",
  },
};

export const isAdminToastCode = (value: string | null): value is AdminToastCode =>
  value === "created" || value === "updated" || value === "deleted";

export const inferAdminToastScope = (pathname: string): AdminToastScope => {
  if (pathname.startsWith("/admin/service")) {
    return "service";
  }
  if (pathname.startsWith("/admin/products") || pathname.startsWith("/admin/list")) {
    return "product";
  }
  return "default";
};

export const getAdminToastMessage = (code: AdminToastCode, scope: AdminToastScope = "default") =>
  TOAST_MESSAGES[scope][code];
