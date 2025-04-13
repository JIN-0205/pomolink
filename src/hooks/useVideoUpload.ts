import storage from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useCallback, useState } from "react";

interface UploadStatus {
  isUploading: boolean;
  progress: number;
  error: string | null;
  downloadUrl: string | null;
}

interface UseVideoUploadReturn {
  uploadStatus: UploadStatus;
  uploadVideo: (blob: Blob, path?: string) => Promise<string>;
  resetUploadStatus: () => void;
}

/**
 * Firebase Storageにビデオをアップロードするためのフック
 */
export function useVideoUpload(): UseVideoUploadReturn {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    progress: 0,
    error: null,
    downloadUrl: null,
  });

  /**
   * Firebase Storageにビデオをアップロード
   * @param blob ビデオBlobデータ
   * @param path 保存先のパス（オプション）
   * @returns ダウンロードURL
   */
  const uploadVideo = useCallback(
    async (blob: Blob, path?: string): Promise<string> => {
      setUploadStatus({
        isUploading: true,
        progress: 0,
        error: null,
        downloadUrl: null,
      });

      try {
        // アップロード先のパスを決定
        const uploadPath = path || `videos/${Date.now()}.mp4`;
        const fileRef = ref(storage, uploadPath);

        // Firebase Storageにアップロード
        await uploadBytes(fileRef, blob, { contentType: "video/mp4" });

        // ダウンロードURLを取得
        const downloadUrl = await getDownloadURL(fileRef);

        // アップロード成功ステータスを設定
        setUploadStatus({
          isUploading: false,
          progress: 100,
          error: null,
          downloadUrl,
        });

        return downloadUrl;
      } catch (error: unknown) {
        console.error("アップロードエラー:", error);

        // エラーステータスを設定
        setUploadStatus({
          isUploading: false,
          progress: 0,
          error: `アップロードエラー: ${error instanceof Error ? error.message : String(error)}`,
          downloadUrl: null,
        });

        throw error;
      }
    },
    []
  );

  /**
   * アップロードステータスをリセット
   */
  const resetUploadStatus = useCallback(() => {
    setUploadStatus({
      isUploading: false,
      progress: 0,
      error: null,
      downloadUrl: null,
    });
  }, []);

  return {
    uploadStatus,
    uploadVideo,
    resetUploadStatus,
  };
}
