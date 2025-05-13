import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UploadType } from "@/types";
import { FileImage, Upload, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";

export interface ImageUploadProps {
  taskId: string;
  onUploadSuccess: (uploads: UploadType[]) => void;
  uploadLoading: boolean;
  setUploadLoading: (loading: boolean) => void;
}

export const ImageUpload = ({
  taskId,
  onUploadSuccess,
  uploadLoading,
  setUploadLoading,
}: ImageUploadProps) => {
  const [uploadDesc, setUploadDesc] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);

    const newPreviews = fileArray.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });

    setPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleImageUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("file", file));
      if (uploadDesc) formData.append("description", uploadDesc);

      const res = await fetch(`/api/tasks/${taskId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUploadSuccess(data.uploads);
        setSelectedFiles([]);
        setPreviews([]);
        setUploadDesc("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast("エラー", { description: "提出物のアップロードに失敗しました" });
      }
    } catch (e) {
      console.error("提出物アップロードエラー:", e);
      toast("エラー", { description: "提出物のアップロードに失敗しました" });
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold flex items-center gap-2">
          <FileImage className="w-4 h-4" />
          <span>提出物アップロード</span>
          <span className="text-xs text-muted-foreground">
            (画像ファイルのみ・複数選択可)
          </span>
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer bg-muted/50 hover:bg-primary/5 transition relative">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-primary mb-2" />
              <p className="mb-2 text-sm text-primary font-semibold">
                クリックして画像を選択
              </p>
              <p className="text-xs text-muted-foreground text-center px-2">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length}件の画像が選択されています`
                  : "PNG, JPG, GIFなど"}
              </p>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              ref={fileInputRef}
              disabled={uploadLoading}
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="画像の説明 (任意)"
            value={uploadDesc}
            onChange={(e) => setUploadDesc(e.target.value)}
            disabled={uploadLoading}
          />
          <Button
            onClick={handleImageUpload}
            disabled={uploadLoading || selectedFiles.length === 0}
            className="w-full"
          >
            {uploadLoading
              ? "アップロード中..."
              : `${selectedFiles.length > 0 ? `${selectedFiles.length}件を` : ""}アップロード`}
          </Button>
          <p className="text-xs text-muted-foreground">
            ※ 説明は全画像に共通で付きます
          </p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-medium mb-2">プレビュー</h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview, idx) => (
              <Card key={idx} className="relative group overflow-hidden">
                <div className="relative aspect-square w-full">
                  <Image
                    src={preview.url}
                    alt={`画像 ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-xs p-2 truncate">{preview.name}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
