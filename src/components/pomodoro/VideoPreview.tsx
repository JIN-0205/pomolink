"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useEffect, useRef, useState } from "react";

interface VideoPreviewProps {
  videoUrl?: string | null;
  videoBlob?: Blob | null;
  isUploading?: boolean;
  isProcessing?: boolean;
  uploadProgress?: number;
  open?: boolean;
  onClose?: () => void;
  onSave?: () => void;
  onDiscard?: () => void;
  onUpload?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}

export default function VideoPreview({
  videoUrl = null,
  videoBlob,
  isUploading = false,
  isProcessing = false,
  uploadProgress = 0,
  open = false,
  onClose,
  onSave,
  onDiscard,
  onUpload,
  onCancel,
  onRetry,
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // BlobからURLを作成
  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoBlob]);

  // ビデオのURL（BlobまたはFirebase URLから）
  const videoSrc = videoUrl || objectUrl;

  // 再生/一時停止を切り替える
  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // ダイアログ内でのコンテンツ
  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-center mb-4">ビデオを処理しています...</p>
          <Progress value={50} className="w-2/3 h-2 mb-2" />
          <p className="text-sm text-center text-gray-500">
            しばらくお待ちください
          </p>
        </div>
      );
    }

    if (!videoSrc) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500">ビデオが利用できません</p>
        </div>
      );
    }

    return (
      <>
        <div className="relative aspect-video mb-4">
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain bg-black rounded-md"
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            controls={false}
            playsInline
          />

          {/* オーバーレイコントロール */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 cursor-pointer transition-opacity hover:bg-opacity-30"
            onClick={togglePlayPause}
          >
            {!isPlaying && (
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white bg-opacity-80">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* アップロード進捗とステータス */}
        {isUploading && (
          <div className="mb-6">
            <Progress value={uploadProgress} className="mb-2" />
            <p className="text-sm text-center text-gray-600">
              {Math.round(uploadProgress)}% アップロード中...
            </p>
          </div>
        )}

        {videoUrl && (
          <div className="mb-6">
            <p className="text-sm text-green-600 mb-2">
              タイムラプスが保存されました！
            </p>
            <p className="text-xs text-gray-600 break-all">{videoUrl}</p>
          </div>
        )}
      </>
    );
  };

  // ダイアログ表示の場合
  if (open) {
    return (
      <Dialog open={open} onOpenChange={onClose ? () => onClose() : undefined}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>セッション録画</DialogTitle>
            <DialogDescription>
              あなたのポモドーロセッションのタイムラプス録画です
            </DialogDescription>
          </DialogHeader>

          {renderContent()}

          <DialogFooter className="gap-2 sm:justify-end">
            {onDiscard && !isProcessing && !isUploading && (
              <Button variant="outline" onClick={onDiscard}>
                破棄
              </Button>
            )}
            {onSave && !isProcessing && !isUploading && !videoUrl && (
              <Button onClick={onSave}>保存する</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // 通常表示（ダイアログではない場合）
  return (
    <div className="bg-slate-100 rounded-lg overflow-hidden">
      {renderContent()}

      {/* アクションボタン */}
      <div className="p-4">
        <div className="flex flex-wrap gap-3 justify-end">
          {onCancel && !isUploading && (
            <Button variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          {onRetry && !isUploading && (
            <Button variant="outline" onClick={onRetry}>
              再録画
            </Button>
          )}
          {onUpload && !isUploading && !videoUrl && (
            <Button onClick={onUpload}>保存する</Button>
          )}
        </div>
      </div>
    </div>
  );
}
