"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface AdminImageDeleteButtonProps {
  action: (formData: FormData) => Promise<{ error: string | null } | void>;
  imageId: string;
  imageUrl: string;
}

export const AdminImageDeleteButton = ({ action, imageId, imageUrl }: AdminImageDeleteButtonProps) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleAction = async () => {
    const shouldDelete = window.confirm("이 이미지를 삭제할까요?");
    if (!shouldDelete) {
      return;
    }

    try {
      setIsPending(true);
      const formData = new FormData();
      formData.append("image_id", imageId);
      formData.append("image_url", imageUrl);
      const result = await action(formData);
      if (result?.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={isPending}
      aria-label="기존 이미지 삭제"
      className="inline-flex items-center justify-center rounded-md border border-red-500/30 px-2 py-2 text-red-500 hover:bg-red-500/10 disabled:opacity-60"
    >
      <Trash2 size={14} />
    </button>
  );
};
