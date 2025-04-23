import { useCallback, useEffect, useRef, useState } from "react";

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
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // isRecordingの値をrefに保存
  const isRecordingRef = useRef(false);

  // captureFrameの実装
  const captureFrame = useCallback(
    (videoElement: HTMLVideoElement) => {
      // 最後に使用したvideo要素を保存
      videoElementRef.current = videoElement;

      // 録画中でない場合はキャプチャしない
      if (!isRecordingRef.current) return;

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

  // 録画開始
  const startRecording = useCallback(() => {
    // 既に録画中の場合は何もしない
    if (isRecordingRef.current) return;

    // まず既存のインターバルがあれば削除
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 録画状態をセット
    setIsRecording(true);
    isRecordingRef.current = true;

    // 実際にフレームをキャプチャするのは別のuseEffect内で行い、
    // ここではフラグの設定だけに留める
  }, []);

  // 録画停止
  const stopRecording = useCallback(() => {
    // 録画中でない場合は何もしない
    if (!isRecordingRef.current) return;

    // インターバルを停止
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 録画状態を更新
    setIsRecording(false);
    isRecordingRef.current = false;
  }, []);

  // フレームをクリア
  const clearFrames = useCallback(() => {
    setFrames([]);
  }, []);

  // isRecordingの値が変わったらrefも更新
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // フレームキャプチャのインターバル処理
  useEffect(() => {
    // 録画中のみインターバル処理を設定
    if (isRecording && videoElementRef.current) {
      // 以前のインターバルがあれば停止
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // レートリミットのために低頻度で処理を実行
      intervalRef.current = setInterval(() => {
        if (isRecordingRef.current && videoElementRef.current) {
          captureFrame(videoElementRef.current);
        }
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isRecording, captureFrame, interval]);

  // クリーンアップ関数
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
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
