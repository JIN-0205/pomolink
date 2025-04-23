"use client";

import { useCamera } from "@/hooks/useCamera";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import { useVideoEncoder } from "@/hooks/useVideoEncoder";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { useCallback, useEffect, useState } from "react";

/** Next.js Client Component */
export default function Mp4MuxerPage() {
  // カスタムフックを使用
  const {
    videoRef,
    error: cameraError,
    isReady,
  } = useCamera({
    width: 640,
    height: 360,
  });

  const {
    frames,
    isRecording,
    canvasRef,
    startRecording,
    stopRecording,
    clearFrames,
  } = useFrameCapture({
    captureWidth: 640,
    captureHeight: 360,
    interval: 1000, // 1秒ごとにフレームをキャプチャ
  });

  const {
    encodingStatus,
    videoUrl,
    encodeFrames,
    resetStatus,
    estimateEncodingTime,
  } = useVideoEncoder();
  const { uploadStatus, uploadVideo } = useVideoUpload();

  // エンコード設定
  const [encodingSettings, setEncodingSettings] = useState({
    fps: 30,
    bitrate: 1_000_000, // 1 Mbps
    chunkSize: 500,
  });

  // 見積もり情報
  const [estimates, setEstimates] = useState({
    encodingTime: { time: 0, unit: "秒" },
    fileSize: 0, // MB
    uploadTime: { min: 0, max: 0, unit: "秒" },
  });

  // MP4 Blob state
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(null);

  // 録画の開始/停止を切り替え
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearFrames(); // 新しい録画を始める前にフレームをクリア
      resetStatus(); // エンコードステータスもリセット
      startRecording();
    }
  };

  // 録画中の場合、videoRefの要素を使ってフレームキャプチャを行う
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording && isReady && videoRef.current) {
      interval = setInterval(() => {
        if (videoRef.current) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = 640;
          tempCanvas.height = 360;
          const ctx = tempCanvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(videoRef.current, 0, 0, 640, 360);

          // useFrameCapture のフレーム配列に追加
          frames.push(tempCanvas);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isReady, videoRef, frames]);

  // フレーム数が変わるたびに見積もりを更新
  useEffect(() => {
    if (frames.length > 0) {
      // エンコード時間の見積もり
      const encodingTimeEst = estimateEncodingTime(
        frames.length,
        encodingSettings.fps
      );

      // ファイルサイズの見積もり（Mbps × 秒 ÷ 8 = MB）
      const durationInSeconds = frames.length / encodingSettings.fps;
      const estimatedSizeMB =
        Math.round(
          ((encodingSettings.bitrate * durationInSeconds) / 8 / 1000 / 1000) *
            10
        ) / 10;

      // アップロード時間の見積もり（サイズ ÷ 推定アップロード速度）
      // 一般的な家庭用回線を想定（5〜20 Mbps）
      const minUploadTimeSec = Math.round((estimatedSizeMB * 8) / 20); // 20Mbpsでの時間
      const maxUploadTimeSec = Math.round((estimatedSizeMB * 8) / 5); // 5Mbpsでの時間

      let uploadTimeUnit = "秒";
      let minTime = minUploadTimeSec;
      let maxTime = maxUploadTimeSec;

      // 単位を調整
      if (maxUploadTimeSec > 60) {
        uploadTimeUnit = "分";
        minTime = Math.round((minUploadTimeSec / 60) * 10) / 10;
        maxTime = Math.round((maxUploadTimeSec / 60) * 10) / 10;
      }

      setEstimates({
        encodingTime: encodingTimeEst,
        fileSize: estimatedSizeMB,
        uploadTime: {
          min: minTime,
          max: maxTime,
          unit: uploadTimeUnit,
        },
      });
    }
  }, [frames.length, encodingSettings, estimateEncodingTime]);

  // WebCodecs API でエンコード
  const handleEncode = useCallback(async () => {
    try {
      if (frames.length === 0) {
        alert("フレームがありません。録画してから再試行してください。");
        return;
      }

      // ビデオエンコード
      const startEncodeTime = performance.now();
      const blob = await encodeFrames(frames, {
        width: frames[0].width,
        height: frames[0].height,
        fps: encodingSettings.fps,
        bitrate: encodingSettings.bitrate,
        keyFrameInterval: 30,
        chunkSize: encodingSettings.chunkSize,
      });
      const endEncodeTime = performance.now();
      console.log(
        `実際のエンコード時間: ${((endEncodeTime - startEncodeTime) / 1000).toFixed(1)}秒`
      );
      setMp4Blob(blob);
    } catch (error: unknown) {
      console.error("処理中にエラーが発生:", error);
    }
  }, [frames, encodeFrames, encodingSettings]);

  // アップロードのみ実行
  const handleUpload = useCallback(async () => {
    if (!mp4Blob) {
      alert("動画がエンコードされていません。");
      return;
    }
    try {
      const downloadUrl = await uploadVideo(
        mp4Blob,
        `timelapse/video-${Date.now()}.mp4`
      );
      console.log("ビデオアップロード完了:", downloadUrl);
    } catch (error) {
      console.error("アップロード中にエラー:", error);
    }
  }, [mp4Blob, uploadVideo]);

  // エンコード設定を変更
  const handleSettingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEncodingSettings((prev) => ({
      ...prev,
      [name]:
        name === "fps" || name === "bitrate" || name === "chunkSize"
          ? parseInt(value)
          : value,
    }));
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">WebCodecs + mp4-muxer デモ</h2>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">カメラプレビュー</h3>
          <button
            onClick={toggleRecording}
            className={`px-4 py-2 rounded-md ${
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {isRecording ? "録画停止" : "録画開始"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              width={320}
              height={180}
              autoPlay
              muted
              className="w-full object-cover"
            />
          </div>

          <div>
            <p className="mb-2">
              キャプチャしたフレーム数:{" "}
              <span className="font-bold">{frames.length}</span>
            </p>
            {isRecording && <p className="text-red-500">録画中...</p>}
            {cameraError && <p className="text-red-500">{cameraError}</p>}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        </div>
      </div>

      {frames.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-4">エンコード設定</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                フレームレート (fps)
              </label>
              <select
                name="fps"
                value={encodingSettings.fps}
                onChange={handleSettingChange}
                className="w-full p-2 border rounded"
              >
                <option value="1">1 fps (低品質)</option>
                <option value="5">5 fps (推奨)</option>
                <option value="10">10 fps (高品質)</option>
                <option value="30">30 fps (動画品質)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                ビットレート
              </label>
              <select
                name="bitrate"
                value={encodingSettings.bitrate}
                onChange={handleSettingChange}
                className="w-full p-2 border rounded"
              >
                <option value="500000">500 Kbps (低品質)</option>
                <option value="1000000">1 Mbps (推奨)</option>
                <option value="2000000">2 Mbps (高品質)</option>
                <option value="5000000">5 Mbps (超高品質)</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md mb-4">
            <h4 className="text-md font-medium mb-2">
              見積もり情報（{frames.length / encodingSettings.fps}秒の動画）
            </h4>
            <ul className="space-y-1 text-sm">
              <li>
                予想ファイルサイズ:{" "}
                <span className="font-semibold">{estimates.fileSize} MB</span>
              </li>
              <li>
                予想エンコード時間:{" "}
                <span className="font-semibold">
                  {estimates.encodingTime.time} {estimates.encodingTime.unit}
                </span>
              </li>
              <li>
                予想アップロード時間:{" "}
                <span className="font-semibold">
                  {estimates.uploadTime.min}〜{estimates.uploadTime.max}{" "}
                  {estimates.uploadTime.unit}
                </span>
              </li>
            </ul>
            <p className="text-xs mt-2 text-gray-500">
              ※デバイス性能やネットワーク環境により実際の時間は変動します
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-4">
            エンコードとアップロード
          </h3>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handleEncode}
              disabled={encodingStatus.isEncoding}
              className={`px-4 py-2 rounded-md ${
                encodingStatus.isEncoding
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
            >
              {encodingStatus.isEncoding
                ? `エンコード中... ${encodingStatus.progress}%`
                : "エンコード"}
            </button>
            <button
              onClick={handleUpload}
              disabled={!mp4Blob || uploadStatus.isUploading}
              className={`px-4 py-2 rounded-md ${
                !mp4Blob || uploadStatus.isUploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              } text-white`}
            >
              {uploadStatus.isUploading
                ? `アップロード中... ${uploadStatus.progress}%`
                : "アップロード"}
            </button>
          </div>

          {(encodingStatus.error || uploadStatus.error) && (
            <p className="text-red-500 mt-2">
              {encodingStatus.error || uploadStatus.error}
            </p>
          )}

          {encodingStatus.progress > 0 && encodingStatus.progress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${encodingStatus.progress}%` }}
              ></div>
            </div>
          )}

          <div>{videoUrl}</div>
          {videoUrl && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">プレビュー:</h4>
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: "300px" }}
              />
              <div className="flex gap-2 mt-2">
                <a
                  href={videoUrl}
                  download={`timelapse-${Date.now()}.mp4`}
                  className="inline-block text-blue-500 hover:underline"
                >
                  ダウンロード
                </a>

                {uploadStatus.downloadUrl && (
                  <a
                    href={uploadStatus.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-green-500 hover:underline"
                  >
                    アップロード済みファイルを表示
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
