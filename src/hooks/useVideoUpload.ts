import { storage } from "@/lib/firebase";
import { useUser } from "@clerk/nextjs";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useCallback, useState } from "react";
import { useFirebaseAuthSync } from "./useFirebaseAuthSync";

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
  useFirebaseAuthSync();

  const { user } = useUser();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    progress: 0,
    error: null,
    downloadUrl: null,
  });

  /**
   * Firebase Storageにビデオをアップロード
   * @param blob ビデオBlobデータ
  //  * @param path 保存先のパス（オプション）
   * @returns ダウンロードURL
   */
  const uploadVideo = useCallback(
    async (blob: Blob): Promise<string> => {
      setUploadStatus({
        isUploading: true,
        progress: 0,
        error: null,
        downloadUrl: null,
      });

      try {
        const userId = user?.id;
        if (!userId) {
          throw new Error(
            "ユーザー情報が取得できません。サインインしてください。"
          );
        }
        const fileName = `${userId}-${Date.now()}.mp4`;
        const uploadPath = `timelapse/${userId}/${fileName}`;
        const fileRef = ref(storage, uploadPath);

        await uploadBytes(fileRef, blob, { contentType: "video/mp4" });

        const downloadUrl = await getDownloadURL(fileRef);

        setUploadStatus({
          isUploading: false,
          progress: 100,
          error: null,
          downloadUrl,
        });

        return downloadUrl;
      } catch (error: unknown) {
        console.error("アップロードエラー:", error);

        setUploadStatus({
          isUploading: false,
          progress: 0,
          error: `アップロードエラー: ${error instanceof Error ? error.message : String(error)}`,
          downloadUrl: null,
        });

        throw error;
      }
    },
    [user]
  );

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
