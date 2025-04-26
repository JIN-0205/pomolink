import { useEffect, useRef, useState } from "react";

interface UseCameraOptions {
  width?: number;
  height?: number;
  frameRate?: number;
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
  const { width = 640, height = 360, frameRate = 10 } = options;

  const videoRef = useRef<HTMLVideoElement>(
    null
  ) as React.RefObject<HTMLVideoElement>;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let mediaStream: MediaStream;

    async function setupCamera() {
      try {
        // カメラストリームを取得
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: width },
            height: { ideal: height },
            frameRate: { ideal: frameRate },
          },
          audio: false,
        });

        if (!mounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        // ストリームを保存
        setStream(mediaStream);

        // ビデオ要素にストリームをセット
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch (err: unknown) {
        console.error("カメラアクセスエラー:", err);
        setError(
          err instanceof Error
            ? err.message
            : "カメラへのアクセスに失敗しました"
        );
      }
    }

    setupCamera();

    // クリーンアップ関数
    return () => {
      mounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [width, height, frameRate]);

  return {
    videoRef,
    stream,
    error,
    isReady,
  };
}
