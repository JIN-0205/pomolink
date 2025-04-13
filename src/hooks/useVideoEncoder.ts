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
  chunkSize?: number; // 一度に処理するフレームの数
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

/**
 * WebCodecs API を使用してビデオをエンコードするフック
 */
export function useVideoEncoder(): UseVideoEncoderReturn {
  const [encodingStatus, setEncodingStatus] = useState<EncodingStatus>({
    isEncoding: false,
    progress: 0,
    error: null,
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  /**
   * フレーム数とfpsから推定エンコード時間を計算する
   * @param frameCount エンコードするフレーム数
   * @param fps フレームレート
   * @returns 推定時間と単位
   */
  const estimateEncodingTime = useCallback((frameCount: number) => {
    // フレーム当たりの平均エンコード時間（ミリ秒）
    // 実際のデバイス性能によって調整が必要
    const avgTimePerFrameMs = 20; // 一般的なデバイスでの推定値
    const totalTimeMs = frameCount * avgTimePerFrameMs;

    // 適切な単位を選択
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

  /**
   * フレームをH.264ビデオにエンコードする
   */
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

      // エンコーディング開始
      setEncodingStatus({
        isEncoding: true,
        progress: 0,
        error: null,
      });

      const {
        width,
        height,
        fps = 5,
        bitrate = 1_000_000, // デフォルトを1Mbpsに変更
        keyFrameInterval = 30,
        chunkSize = 500, // デフォルトのチャンクサイズ
      } = options;

      try {
        // mp4-muxer のインスタンスを作成
        const muxer = new Muxer({
          target: new ArrayBufferTarget(),
          video: {
            codec: "avc", // H.264
            width,
            height,
          },
          fastStart: "in-memory",
        });

        // VideoEncoder を設定
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
          codec: "avc1.42001f", // Baseline H.264
          width,
          height,
          bitrate,
          bitrateMode: "constant",
        });

        // フレームをチャンクに分けてエンコード
        const frameDuration = 1_000_000 / fps; // マイクロ秒単位
        const totalFrames = frames.length;
        const totalChunks = Math.ceil(totalFrames / chunkSize);

        console.time("Total encoding time");

        // チャンク単位で処理
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const startFrameIndex = chunkIndex * chunkSize;
          const endFrameIndex = Math.min(
            (chunkIndex + 1) * chunkSize,
            totalFrames
          );
          const currentChunkSize = endFrameIndex - startFrameIndex;

          console.log(
            `Processing chunk ${chunkIndex + 1}/${totalChunks}, frames ${startFrameIndex} to ${
              endFrameIndex - 1
            }`
          );

          // このチャンク内のフレームを処理
          for (let i = 0; i < currentChunkSize; i++) {
            const frameIndex = startFrameIndex + i;
            const bmp = await createImageBitmap(frames[frameIndex]);
            const timestamp = frameIndex * frameDuration;
            const videoFrame = new VideoFrame(bmp, { timestamp });

            // キーフレームを適切に挿入
            const keyFrame = frameIndex % keyFrameInterval === 0;
            videoEncoder.encode(videoFrame, { keyFrame });

            videoFrame.close();
            bmp.close();

            // 進捗状況を更新
            setEncodingStatus((prev) => ({
              ...prev,
              progress: Math.round(((frameIndex + 1) / totalFrames) * 100),
            }));

            // メモリリークを防ぐため、適宜GCを促す
            if (i % 100 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }
        }

        // エンコーダーをフラッシュして終了
        await videoEncoder.flush();
        videoEncoder.close();

        console.timeEnd("Total encoding time");

        // mp4-muxer で MP4 に仕上げる
        muxer.finalize();
        const mp4Buffer = muxer.target.buffer;
        const mp4Blob = new Blob([mp4Buffer], { type: "video/mp4" });

        // ローカルで再生用のURLを作成
        const url = URL.createObjectURL(mp4Blob);
        setVideoUrl(url);

        // 完了状態を設定
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

  /**
   * エンコードステータスをリセット
   */
  const resetStatus = useCallback(() => {
    setEncodingStatus({
      isEncoding: false,
      progress: 0,
      error: null,
    });

    // 以前の動画URLがあれば解放
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
