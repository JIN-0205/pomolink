import { useEffect, useRef, useState } from "react";

interface UseCameraOptions {
  width?: number;
  height?: number;
  frameRate?: number;
  enabled?: boolean; // カメラの有効/無効を制御
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  error: string | null;
  isReady: boolean;
}

/**
 * カメラからの映像ストリームを取得・制御するフック
 */
export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { width = 640, height = 360, frameRate = 10, enabled = true } = options;

  const videoRef = useRef<HTMLVideoElement>(
    null
  ) as React.RefObject<HTMLVideoElement>;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // カメラが無効になった時の専用クリーンアップ
  useEffect(() => {
    if (!enabled && stream) {
      console.log("カメラを無効化中...");
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsReady(false);
      setError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [enabled, stream]);

  // カメラが有効になった時の専用セットアップ
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    let mediaStream: MediaStream | null = null;

    async function setupCamera() {
      try {
        console.log("カメラを起動中...");
        setError(null);

        // カメラストリームを取得
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: width },
            height: { ideal: height },
            frameRate: { ideal: frameRate },
          },
          audio: false,
        });

        if (!mounted || !enabled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        // ストリームを保存
        setStream(mediaStream);

        // ビデオ要素にストリームをセット
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            await videoRef.current.play();
            setIsReady(true);
            console.log("カメラが正常に起動しました");
          } catch (playError) {
            console.error("ビデオ再生エラー:", playError);
            setError("ビデオの再生に失敗しました");
          }
        }
      } catch (err: unknown) {
        console.error("カメラアクセスエラー:", err);
        setError(
          err instanceof Error
            ? err.message
            : "カメラへのアクセスに失敗しました"
        );
        setIsReady(false);
      }
    }

    setupCamera();

    // クリーンアップ関数
    return () => {
      mounted = false;
      if (mediaStream && mediaStream.active) {
        console.log("カメラストリームをクリーンアップ中...");
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [enabled, width, height, frameRate]);

  return {
    videoRef,
    stream,
    error,
    isReady,
  };
}
