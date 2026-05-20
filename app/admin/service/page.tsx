import Link from "next/link";
import { Plus, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface ServiceCaseListRow {
  id: string;
  title: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

export default async function AdminServiceListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("azen_service_cases")
    .select("id, title, is_published, sort_order, created_at")
    .order("created_at", { ascending: false });

  const caseRows = (data ?? []) as ServiceCaseListRow[];

  return (
    <main className="mx-auto w-full max-w-6xl p-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">시공사례 관리</h1>
        <Link
          href="/admin/service/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} />
          시공사례 등록
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">등록된 시공사례를 관리할 수 있습니다.</p>

      <div className="mt-5">
        {error ? (
          <section className="glass-card rounded-2xl border border-border p-6">
            <p className="text-sm text-red-500">시공사례 목록을 불러오지 못했습니다: {error.message}</p>
          </section>
        ) : caseRows.length === 0 ? (
          <section className="glass-card rounded-2xl border border-border p-10 text-center">
            <Wrench className="mx-auto mb-3 text-muted-foreground" size={28} />
            <p className="text-base font-medium">등록된 시공사례가 없습니다.</p>
            <p className="mt-1 text-sm text-muted-foreground">첫 번째 시공사례를 등록해보세요.</p>
          </section>
        ) : (
          <section className="glass-card overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="px-4 py-3 font-medium">제목</th>
                  <th className="px-4 py-3 font-medium">공개여부</th>
                  <th className="px-4 py-3 font-medium">정렬순서</th>
                  <th className="px-4 py-3 font-medium">등록일</th>
                </tr>
              </thead>
              <tbody>
                {caseRows.map((serviceCase, index) => (
                  <tr key={serviceCase.id} className="border-b border-border/80 last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">{caseRows.length - index}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/service/${serviceCase.id}/edit`}
                        className="underline-offset-4 hover:text-primary hover:underline"
                      >
                        {serviceCase.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                          serviceCase.is_published
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                            : "border-gray-400/40 bg-gray-400/15 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {serviceCase.is_published ? "공개" : "비공개"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{serviceCase.sort_order}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(serviceCase.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}
