"use client";

import { useFirebaseAuthSync } from "@/hooks/useFirebaseAuthSync";
import firebaseApp, { storage } from "@/lib/firebase";
import { useUser } from "@clerk/nextjs";
import { getAuth } from "firebase/auth";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
interface FileMetadata {
  name: string;
  size: number;
  contentType: string;
  fullPath: string;
  timeCreated: string;
  downloadURL: string;
}

interface MediaUploaderProps {
  mediaType: "image" | "video" | "all";
  maxSizeMB?: number;
  folderPath?: string;
  onUploadComplete?: (url: string, metadata: FileMetadata) => void;
}

export default function MediaUploader({
  mediaType = "all",
  maxSizeMB = 100, // デフォルトは100MB
  // folderPath = "",
  onUploadComplete,
}: MediaUploaderProps) {
  useFirebaseAuthSync();
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const getAcceptString = () => {
    switch (mediaType) {
      case "image":
        return "image/*";
      case "video":
        return "video/*";
      case "all":
      default:
        return "image/*,video/*";
    }
  };

  const getMediaFolder = (fileType: string) => {
    const userId = user?.id;
    if (!userId) return null;
    if (fileType.startsWith("image/")) {
      return `timelapse/${userId}/images`;
    } else if (fileType.startsWith("video/")) {
      return `timelapse/${userId}/videos`;
    }
    return `timelapse/${userId}/media`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // ファイルサイズチェック
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        setError(`ファイルサイズが大きすぎます（最大 ${maxSizeMB}MB）`);
        return;
      }

      // ファイルタイプチェック
      if (mediaType === "image" && !selectedFile.type.startsWith("image/")) {
        setError("画像ファイルを選択してください");
        return;
      }

      if (mediaType === "video" && !selectedFile.type.startsWith("video/")) {
        setError("動画ファイルを選択してください");
        return;
      }

      setFile(selectedFile);
      setError(null);

      // プレビュー生成
      const previewURL = URL.createObjectURL(selectedFile);
      setMediaPreview(previewURL);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("ファイルが選択されていません");
      return;
    }
    if (!user?.id) {
      setError("ユーザー情報が取得できません。サインインしてください。");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // ファイル名にタイムスタンプを追加して一意にする
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      const folder = getMediaFolder(file.type);
      if (!folder) {
        setError("アップロード先パスの生成に失敗しました");
        setIsUploading(false);
        return;
      }
      const storageRef = ref(storage, `${folder}/${fileName}`);

      // メタデータの設定
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      };

      // アップロードタスクの作成
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // アップロード進捗の監視
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // 進捗状況の計算
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(percent);
        },
        (error) => {
          // エラーハンドリング
          setError("アップロード中にエラーが発生しました");
          setIsUploading(false);
          console.error("Upload error:", error);
        },
        async () => {
          // アップロード完了時の処理
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setDownloadURL(url);

          // メタデータを取得
          const fileMetadata = {
            name: fileName,
            size: file.size,
            contentType: file.type,
            fullPath: uploadTask.snapshot.ref.fullPath,
            timeCreated: new Date().toISOString(),
            downloadURL: url,
          };

          if (onUploadComplete) onUploadComplete(url, fileMetadata);
          setIsUploading(false);
        }
      );
    } catch (err) {
      setError("アップロード準備中にエラーが発生しました");
      setIsUploading(false);
      console.error("Error preparing upload:", err);
    }
  };

  // クリーンアップ関数

  // コンポーネントのアンマウント時にオブジェクトURLを解放
  useEffect(() => {
    const cleanupPreview = () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
    return () => {
      cleanupPreview();
    };
  }, [mediaPreview]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {mediaType === "image"
            ? "画像"
            : mediaType === "video"
              ? "動画"
              : "メディア"}
          を選択
        </label>
        <input
          type="file"
          accept={getAcceptString()}
          onChange={handleFileChange}
          disabled={isUploading}
          className="mt-1 block w-full text-sm border border-gray-300 rounded-md p-2"
        />
        <p className="mt-1 text-xs text-gray-500">最大サイズ: {maxSizeMB}MB</p>
      </div>

      {file && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">選択中: {file.name}</p>
          <p className="text-xs text-gray-500">
            サイズ: {(file.size / (1024 * 1024)).toFixed(2)}MB
          </p>
        </div>
      )}

      {mediaPreview && (
        <div className="mt-4 border rounded-md p-2">
          <p className="text-sm font-medium mb-2">プレビュー:</p>
          {file?.type.startsWith("image/") ? (
            <div className="flex justify-center items-center">
              <Image
                width={300}
                height={300}
                src={mediaPreview}
                alt="Preview"
                className="max-w-[300px] h-auto max-h-64 rounded"
              />
            </div>
          ) : file?.type.startsWith("video/") ? (
            <div className="flex justify-center items-center">
              <video
                ref={videoRef}
                src={mediaPreview}
                controls
                className="max-w-full max-h-64 rounded"
              />
            </div>
          ) : null}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`px-4 py-2 rounded-md ${
          !file || isUploading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {isUploading ? "アップロード中..." : "アップロード"}
      </button>

      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="mt-1 text-sm text-gray-600">{progress}%</p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {downloadURL && (
        <div className="mt-4">
          <p className="text-sm text-green-600">アップロード完了!</p>

          {file?.type.startsWith("image/") ? (
            <div className="mt-2">
              <Image
                src={downloadURL}
                alt="Uploaded file"
                className="max-w-xs h-auto rounded-md"
              />
            </div>
          ) : file?.type.startsWith("video/") ? (
            <div className="mt-2">
              <video
                src={downloadURL}
                controls
                className="max-w-xs h-auto rounded-md"
              />
            </div>
          ) : null}

          <p className="mt-1 text-xs text-gray-500 break-words">
            URL: {downloadURL}
          </p>
        </div>
      )}
      <div
        onClick={() => {
          console.log("Clerk user.id:", user?.id);
          console.log(
            "Firebase Auth uid:",
            getAuth(firebaseApp).currentUser?.uid
          );
        }}
      >
        hello
      </div>
    </div>
  );
}
