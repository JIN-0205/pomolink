"use client";

import MediaGallery from "@/components/imageTest/MediaGallery";
import MediaUploader from "@/components/imageTest/MediaUploader";
import { useState } from "react";

type MediaItem = {
  name: string;
  url: string;
  fullPath: string;
  type: "image" | "video" | "other";
  contentType: string;
  size: number;
  timeCreated: string;
};

export default function MediaManagerPage() {
  const [mediaType, setMediaType] = useState<"image" | "video" | "all">("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const handleUploadComplete = () => {
    // ギャラリーを更新するためにrefreshTriggerを更新
    setRefreshTrigger((prev) => prev + 1);
    setShowUploader(false);
  };

  const handleMediaSelect = (media: MediaItem) => {
    setSelectedMedia(media);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">メディア管理</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* サイドバー */}
        <div className="lg:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">フィルタ</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メディアタイプ
              </label>
              <select
                value={mediaType}
                onChange={(e) =>
                  setMediaType(e.target.value as "image" | "video" | "all")
                }
                className="w-full border rounded-md p-2"
              >
                <option value="all">すべて</option>
                <option value="image">画像のみ</option>
                <option value="video">動画のみ</option>
              </select>
            </div>

            <button
              onClick={() => setShowUploader((prev) => !prev)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 px-4"
            >
              {showUploader ? "アップローダーを閉じる" : "新規アップロード"}
            </button>

            {selectedMedia && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium">選択中のメディア</h3>
                <p className="text-xs truncate mt-1">{selectedMedia.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedMedia.timeCreated).toLocaleString()}
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMedia.url);
                      alert("URLをコピーしました");
                    }}
                    className="text-xs bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded"
                  >
                    URLをコピー
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="lg:w-3/4">
          {showUploader && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-medium mb-4">
                メディアをアップロード
              </h2>
              <MediaUploader
                mediaType={mediaType === "all" ? "all" : mediaType}
                maxSizeMB={200}
                folderPath=""
                onUploadComplete={() => handleUploadComplete()}
              />
            </div>
          )}

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">メディアギャラリー</h2>
            <MediaGallery
              mediaType={mediaType}
              refreshTrigger={refreshTrigger}
              selectable={true}
              onSelect={handleMediaSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
