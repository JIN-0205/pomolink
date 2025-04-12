"use client";

import storage from "@/lib/firebase";
import { deleteObject, ref } from "firebase/storage";
import { useState } from "react";

interface MediaDeleterProps {
  mediaPath: string; // Firebase Storage内のファイルパス
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
  showConfirmDialog?: boolean;
  buttonText?: string;
  customClass?: string;
}

export default function MediaDeleter({
  mediaPath,
  onDeleteSuccess,
  onDeleteError,
  showConfirmDialog = true,
  buttonText = "削除",
  customClass = "",
}: MediaDeleterProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!mediaPath) return;

    if (showConfirmDialog) {
      const confirmDelete = window.confirm("このメディアを削除しますか？");
      if (!confirmDelete) return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const mediaRef = ref(storage, mediaPath);
      await deleteObject(mediaRef);

      if (onDeleteSuccess) onDeleteSuccess();
    } catch (err) {
      const errorMessage = "削除中にエラーが発生しました";
      setError(errorMessage);
      console.error("Delete error:", err);

      if (onDeleteError && err instanceof Error) onDeleteError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`px-3 py-1 rounded-md text-sm ${
        isDeleting
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-red-500 hover:bg-red-600 text-white"
      } ${customClass}`}
      aria-busy={isDeleting}
    >
      {isDeleting ? "削除中..." : buttonText}
      {error && <span className="sr-only">{error}</span>}
    </button>
  );
}
