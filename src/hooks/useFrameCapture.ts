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

  const isRecordingRef = useRef(false);

  const captureFrame = useCallback(
    (videoElement: HTMLVideoElement) => {
      videoElementRef.current = videoElement;

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

  const startRecording = useCallback(() => {
    if (isRecordingRef.current) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsRecording(true);
    isRecordingRef.current = true;
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsRecording(false);
    isRecordingRef.current = false;
  }, []);

  const clearFrames = useCallback(() => {
    setFrames([]);
  }, []);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && videoElementRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

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
