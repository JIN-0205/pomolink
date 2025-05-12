"use client";

import MediaDeleter from "@/components/imageTest/MediaDeleter";
import storage from "@/lib/firebase";
import { getDownloadURL, getMetadata, listAll, ref } from "firebase/storage";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type MediaItem = {
  name: string;
  url: string;
  fullPath: string;
  type: "image" | "video" | "other";
  contentType: string;
  size: number;
  timeCreated: string;
};

interface MediaGalleryProps {
  folderPath?: string;
  mediaType?: "image" | "video" | "all";
  onSelect?: (media: MediaItem) => void;
  selectable?: boolean;
  refreshTrigger?: number; // このプロパティが変更されたらギャラリーを更新
}

export default function MediaGallery({
  folderPath = "",
  mediaType = "all",
  onSelect,
  selectable = false,
  // refreshTrigger = 0,
}: MediaGalleryProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const baseRef = ref(storage, folderPath);
      const folderRefs = [];

      // フォルダ構造に基づいて検索対象を設定
      if (mediaType === "image" || mediaType === "all") {
        folderRefs.push(
          ref(storage, `${folderPath}/images`.replace(/^\//, ""))
        );
      }
      if (mediaType === "video" || mediaType === "all") {
        folderRefs.push(
          ref(storage, `${folderPath}/videos`.replace(/^\//, ""))
        );
      }
      if (folderPath === "" && mediaType === "all") {
        // ルートの場合はそのまま検索
        folderRefs.push(baseRef);
      }

      // 全てのフォルダから結果を取得
      const allMedia: MediaItem[] = [];

      await Promise.all(
        folderRefs.map(async (folderRef) => {
          try {
            const result = await listAll(folderRef);

            const mediaPromises = result.items.map(async (item) => {
              try {
                const [url, metadata] = await Promise.all([
                  getDownloadURL(item),
                  getMetadata(item),
                ]);

                let type: "image" | "video" | "other" = "other";
                if (metadata.contentType?.startsWith("image/")) type = "image";
                else if (metadata.contentType?.startsWith("video/"))
                  type = "video";

                return {
                  name: item.name,
                  url: url,
                  fullPath: item.fullPath,
                  type: type,
                  contentType: metadata.contentType || "",
                  size: metadata.size || 0,
                  timeCreated: metadata.timeCreated || "",
                };
              } catch (err) {
                console.error(`Error fetching item ${item.fullPath}:`, err);
                return null;
              }
            });

            const mediaItems = await Promise.all(mediaPromises);
            // nullを除外
            allMedia.push(
              ...mediaItems.filter((item): item is MediaItem => item !== null)
            );
          } catch (err) {
            console.warn(`Folder ${folderRef.fullPath} might not exist:`, err);
          }
        })
      );

      // 時間順に並べ替え（最新が先頭）
      allMedia.sort(
        (a, b) =>
          new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime()
      );

      setMediaList(allMedia);
    } catch (err) {
      setError("メディアの取得中にエラーが発生しました");
      console.error("Error fetching media:", err);
    } finally {
      setLoading(false);
    }
  }, [folderPath, mediaType]);

  // 初期ロードとrefreshTriggerが変更された時に再取得
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleMediaSelect = (media: MediaItem) => {
    if (!selectable) return;

    setSelectedMedia(media.fullPath);
    if (onSelect) onSelect(media);
  };

  const handleDeleteSuccess = (deletedPath: string) => {
    setMediaList((prev) =>
      prev.filter((item) => item.fullPath !== deletedPath)
    );
  };

  if (loading) {
    return <div className="p-4 text-center">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={fetchMedia}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          再試行
        </button>
      </div>
    );
  }

  if (mediaList.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">メディアがありません</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {mediaList.map((media) => (
        <div
          key={media.fullPath}
          className={`border rounded-lg overflow-hidden ${
            selectable ? "cursor-pointer" : ""
          } ${selectedMedia === media.fullPath ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => handleMediaSelect(media)}
        >
          {media.type === "image" ? (
            <div className="relative pt-[75%]">
              <Image
                src={media.url}
                alt={media.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            </div>
          ) : media.type === "video" ? (
            <div className="relative pt-[75%]">
              <video
                src={media.url}
                controls
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-40 bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">不明なファイル形式</p>
            </div>
          )}

          <div className="p-2">
            <p className="text-sm font-medium truncate" title={media.name}>
              {media.name}
            </p>
            <p className="text-xs text-gray-500">
              {(media.size / (1024 * 1024)).toFixed(2)}MB
            </p>

            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {new Date(media.timeCreated).toLocaleDateString()}
              </span>

              <MediaDeleter
                mediaPath={media.fullPath}
                onDeleteSuccess={() => handleDeleteSuccess(media.fullPath)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
