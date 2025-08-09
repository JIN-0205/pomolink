import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { useCallback, useState } from "react";

interface EncodingStatus {
  isEncoding: boolean;
  progress: number;
  error: string | null;
}

interface EncodingOptions {
  width: number;
  height: number;
  fps?: number;
  bitrate?: number;
  keyFrameInterval?: number;
  chunkSize?: number;
}

interface UseVideoEncoderReturn {
  encodingStatus: EncodingStatus;
  videoUrl: string | null;
  encodeFrames: (
    frames: HTMLCanvasElement[],
    options: EncodingOptions
  ) => Promise<Blob>;
  resetStatus: () => void;
  estimateEncodingTime: (
    frameCount: number,
    fps: number
  ) => { time: number; unit: string };
}

export function useVideoEncoder(): UseVideoEncoderReturn {
  const [encodingStatus, setEncodingStatus] = useState<EncodingStatus>({
    isEncoding: false,
    progress: 0,
    error: null,
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  /**
   * @param frameCount エンコードするフレーム数
   * @param fps フレームレート
   * @returns 推定時間と単位
   */
  const estimateEncodingTime = useCallback((frameCount: number) => {
    const avgTimePerFrameMs = 20;
    const totalTimeMs = frameCount * avgTimePerFrameMs;

    if (totalTimeMs < 60000) {
      return { time: Math.round(totalTimeMs / 1000), unit: "秒" };
    } else if (totalTimeMs < 3600000) {
      return { time: Math.round(totalTimeMs / 60000), unit: "分" };
    } else {
      return {
        time: Math.round((totalTimeMs / 3600000) * 10) / 10,
        unit: "時間",
      };
    }
  }, []);

  const encodeFrames = useCallback(
    async (
      frames: HTMLCanvasElement[],
      options: EncodingOptions
    ): Promise<Blob> => {
      if (!("VideoEncoder" in window)) {
        const error = "ブラウザがWebCodecs APIをサポートしていません";
        setEncodingStatus({ isEncoding: false, progress: 0, error });
        throw new Error(error);
      }

      if (frames.length === 0) {
        const error = "エンコードするフレームがありません";
        setEncodingStatus({ isEncoding: false, progress: 0, error });
        throw new Error(error);
      }

      setEncodingStatus({
        isEncoding: true,
        progress: 0,
        error: null,
      });

      const {
        width,
        height,
        fps = 5,
        bitrate = 1_000_000,
        keyFrameInterval = 30,
        chunkSize = 500,
      } = options;

      try {
        const muxer = new Muxer({
          target: new ArrayBufferTarget(),
          video: {
            codec: "avc",
            width,
            height,
          },
          fastStart: "in-memory",
        });

        const videoEncoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
          error: (err) => {
            console.error("Encoder error:", err);
            setEncodingStatus((prev) => ({
              ...prev,
              error: `エンコードエラー: ${err.message}`,
            }));
          },
        });

        videoEncoder.configure({
          codec: "avc1.42001f",
          width,
          height,
          bitrate,
          bitrateMode: "constant",
        });

        const frameDuration = 1_000_000 / fps;
        const totalFrames = frames.length;
        const totalChunks = Math.ceil(totalFrames / chunkSize);

        console.time("Total encoding time");

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const startFrameIndex = chunkIndex * chunkSize;
          const endFrameIndex = Math.min(
            (chunkIndex + 1) * chunkSize,
            totalFrames
          );
          const currentChunkSize = endFrameIndex - startFrameIndex;

          for (let i = 0; i < currentChunkSize; i++) {
            const frameIndex = startFrameIndex + i;
            const bmp = await createImageBitmap(frames[frameIndex]);
            const timestamp = frameIndex * frameDuration;
            const videoFrame = new VideoFrame(bmp, { timestamp });

            const keyFrame = frameIndex % keyFrameInterval === 0;
            videoEncoder.encode(videoFrame, { keyFrame });

            videoFrame.close();
            bmp.close();

            setEncodingStatus((prev) => ({
              ...prev,
              progress: Math.round(((frameIndex + 1) / totalFrames) * 100),
            }));

            if (i % 100 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }
        }

        await videoEncoder.flush();
        videoEncoder.close();

        console.timeEnd("Total encoding time");

        muxer.finalize();
        const mp4Buffer = muxer.target.buffer;
        const mp4Blob = new Blob([mp4Buffer], { type: "video/mp4" });

        const url = URL.createObjectURL(mp4Blob);
        setVideoUrl(url);

        setEncodingStatus({
          isEncoding: false,
          progress: 100,
          error: null,
        });

        return mp4Blob;
      } catch (error: unknown) {
        console.error("エンコード中にエラー:", error);
        setEncodingStatus({
          isEncoding: false,
          progress: 0,
          error: `エラー発生: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
        throw error;
      }
    },
    []
  );

  const resetStatus = useCallback(() => {
    setEncodingStatus({
      isEncoding: false,
      progress: 0,
      error: null,
    });

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
  }, [videoUrl]);

  return {
    encodingStatus,
    videoUrl,
    encodeFrames,
    resetStatus,
    estimateEncodingTime,
  };
}
