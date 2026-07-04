import { LoginForm } from "@/components/features/LoginForm";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="text-xl font-semibold">관리자 로그인</h1>
      <p className="text-sm text-muted-foreground">
        이메일/비밀번호로 로그인하면 관리자 페이지로 이동합니다.
      </p>
      <LoginForm />
    </main>
  );
}
