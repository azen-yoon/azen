"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminActionToast } from "@/components/features/AdminActionToast";

interface ProductOption {
  id: string;
  name: string;
}

interface SlotItem {
  slot: number;
  product_id: string | null;
}

interface MainCarouselFormState {
  success: string | null;
  error: string | null;
}

interface AdminMainCarouselFormProps {
  slots: SlotItem[];
  products: ProductOption[];
  action: (state: MainCarouselFormState, formData: FormData) => Promise<MainCarouselFormState>;
}

export const AdminMainCarouselForm = ({ slots, products, action }: AdminMainCarouselFormProps) => {
  const [slotValues, setSlotValues] = useState<Record<number, string>>(
    Object.fromEntries(slots.map((slot) => [slot.slot, slot.product_id ?? ""])),
  );
  const [state, formAction, isPending] = useActionState(action, {
    success: null,
    error: null,
  });
  const [dismissedSuccessMessage, setDismissedSuccessMessage] = useState<string | null>(null);
  const successMessage = state.success && state.success !== dismissedSuccessMessage ? state.success : null;

  return (
    <>
      <form action={formAction} className="relative space-y-4">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[1px]">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm">
              <Loader2 size={16} className="animate-spin" />
              저장 중...
            </div>
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => (
            <section key={slot.slot} className="glass-card rounded-xl border border-border p-4">
              <p className="mb-2 text-sm font-semibold">슬롯 {slot.slot}</p>
              <select
                name={`slot_${slot.slot}`}
                value={slotValues[slot.slot] ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSlotValues((prev) => ({
                    ...prev,
                    [slot.slot]: nextValue,
                  }));
                }}
                disabled={isPending}
                className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">미선택(비움)</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </section>
          ))}
        </div>

        {state.error && <p className="text-sm text-red-500">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          onClick={() => setDismissedSuccessMessage(null)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
      </form>

      {successMessage && (
        <AdminActionToast
          message={successMessage}
          onClose={() => setDismissedSuccessMessage(state.success)}
        />
      )}
    </>
  );
};
