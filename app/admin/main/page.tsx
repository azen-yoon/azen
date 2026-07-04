import { AdminMainCarouselForm } from "@/components/features/AdminMainCarouselForm";
import { createClient } from "@/lib/supabase/server";

export const preferredRegion = "icn1";

interface MainCarouselFormState {
  success: string | null;
  error: string | null;
}

interface SlotRow {
  slot: number;
  product_id: string | null;
}

export default async function AdminMainPage() {
  const supabase = await createClient();
  const [{ data: products, error: productsError }, { data: slotRows, error: slotsError }] = await Promise.all([
    supabase.from("azen_products").select("id, name").order("name", { ascending: true }),
    supabase.from("azen_main_carousel").select("slot, product_id").order("slot", { ascending: true }),
  ]);

  const slots: SlotRow[] = Array.from({ length: 6 }, (_, idx) => {
    const slot = idx + 1;
    const current = (slotRows ?? []).find((row) => row.slot === slot);
    return {
      slot,
      product_id: current?.product_id ?? null,
    };
  });

  const saveAction = async (
    _: MainCarouselFormState,
    formData: FormData,
  ): Promise<MainCarouselFormState> => {
    "use server";

    const actionClient = await createClient();
    const rows = Array.from({ length: 6 }, (_, idx) => {
      const slot = idx + 1;
      const productId = String(formData.get(`slot_${slot}`) ?? "").trim();
      return {
        slot,
        product_id: productId || null,
      };
    });

    const updateResults = await Promise.all(
      rows.map((row) =>
        actionClient
          .from("azen_main_carousel")
          .upsert({ slot: row.slot, product_id: row.product_id }, { onConflict: "slot" }),
      ),
    );

    const failed = updateResults.find((result) => result.error);
    if (failed?.error) {
      return {
        success: null,
        error: `저장 중 오류가 발생했습니다: ${failed.error.message}`,
      };
    }

    return {
      success: "메인 Products 캐러셀 슬롯이 저장되었습니다.",
      error: null,
    };
  };

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-xl font-semibold">메인 관리</h1>
      <p className="mt-2 text-sm text-muted-foreground">Products 캐러셀 슬롯 1~6에 노출할 제품을 선택하세요.</p>

      <section className="mt-5">
        {productsError || slotsError ? (
          <div className="glass-card rounded-2xl border border-border p-6 text-sm text-red-500">
            데이터를 불러오지 못했습니다.
          </div>
        ) : (
          <AdminMainCarouselForm
            slots={slots}
            products={(products ?? []) as Array<{ id: string; name: string }>}
            action={saveAction}
          />
        )}
      </section>
    </main>
  );
}
