import { useCallback, useRef, useState } from "react";

interface UseFrameCaptureOptions {
  captureWidth?: number;
  captureHeight?: number;
  interval?: number;
}

interface UseFrameCaptureReturn {
  frames: HTMLCanvasElement[];
  isRecording: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startRecording: () => void;
  stopRecording: () => void;
  captureFrame: (videoElement: HTMLVideoElement) => void;
  clearFrames: () => void;
}

/**
 * ビデオからフレームをキャプチャするためのフック
 */
export function useFrameCapture(
  options: UseFrameCaptureOptions = {}
): UseFrameCaptureReturn {
  const {
    captureWidth = 640,
    captureHeight = 360,
    interval = 1000, // デフォルトは1秒間隔
  } = options;

  const [frames, setFrames] = useState<HTMLCanvasElement[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 単一フレームをキャプチャする
   */
  const captureFrame = useCallback(
    (videoElement: HTMLVideoElement) => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = captureWidth;
      tempCanvas.height = captureHeight;
      const ctx = tempCanvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(videoElement, 0, 0, captureWidth, captureHeight);
      setFrames((prev) => [...prev, tempCanvas]);

      return tempCanvas;
    },
    [captureWidth, captureHeight]
  );

  /**
   * 録画を開始する
   */
  const startRecording = useCallback(() => {
    if (isRecording) return;

    setIsRecording(true);

    intervalRef.current = setInterval(() => {
      const videoElement = document.querySelector("video");
      if (!videoElement) return;

      captureFrame(videoElement);
    }, interval);
  }, [isRecording, interval, captureFrame]);

  /**
   * 録画を停止する
   */
  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsRecording(false);
  }, [isRecording]);

  /**
   * フレームをクリアする
   */
  const clearFrames = useCallback(() => {
    setFrames([]);
  }, []);

  return {
    frames,
    isRecording,
    canvasRef,
    startRecording,
    stopRecording,
    captureFrame,
    clearFrames,
  };
}
