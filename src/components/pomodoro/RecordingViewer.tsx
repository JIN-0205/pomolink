import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Calendar, Clock, Video, VideoOff } from "lucide-react";
import React, { useEffect, useState } from "react";

interface RecordingViewerProps {
  sessionId: string;
  onError?: (error: string) => void;
}

interface RecordingInfo {
  recordingUrl: string | null;
  daysUntilExpiration: number | null;
  minutesUntilExpiration: number | null;
  isExpired: boolean;
}

export const RecordingViewer: React.FC<RecordingViewerProps> = ({
  sessionId,
  onError,
}) => {
  const [recordingInfo, setRecordingInfo] = useState<RecordingInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecordingInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/pomodoro/sessions/${sessionId}/recording`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRecordingInfo(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "録画情報の取得に失敗しました";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordingInfo();
  }, [sessionId, onError]);

  const getExpirationBadge = () => {
    // 分単位の期限切れチェック（フリープランのテスト用）
    if (
      recordingInfo?.minutesUntilExpiration !== null &&
      recordingInfo?.minutesUntilExpiration !== undefined
    ) {
      const minutes = recordingInfo.minutesUntilExpiration;

      if (minutes <= 0) {
        return <Badge variant="destructive">期限切れ</Badge>;
      } else if (minutes <= 2) {
        return <Badge variant="destructive">あと{minutes}分で期限切れ</Badge>;
      } else if (minutes <= 5) {
        return <Badge variant="secondary">あと{minutes}分で期限切れ</Badge>;
      }

      return <Badge variant="outline">あと{minutes}分で期限切れ</Badge>;
    }

    // 日単位の期限切れチェック（通常プラン用）
    if (!recordingInfo?.daysUntilExpiration) return null;

    const days = recordingInfo.daysUntilExpiration;

    if (days <= 0) {
      return <Badge variant="destructive">期限切れ</Badge>;
    } else if (days <= 3) {
      return <Badge variant="secondary">あと{days}日で期限切れ</Badge>;
    } else if (days <= 7) {
      return <Badge variant="outline">あと{days}日で期限切れ</Badge>;
    }

    return <Badge variant="default">あと{days}日で期限切れ</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            録画
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            エラー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!recordingInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <VideoOff className="w-5 h-5" />
            録画なし
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">このセッションには録画がありません。</p>
        </CardContent>
      </Card>
    );
  }

  if (recordingInfo.isExpired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <VideoOff className="w-5 h-5 text-red-500" />
            録画期限切れ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600 mb-3">
            <AlertCircle className="w-4 h-4" />
            <p>この録画は保存期間を過ぎたため、視聴できません。</p>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            プランの録画保存期間を過ぎた録画は自動的に削除されます。
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/pricing")}
          >
            プランを確認する
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!recordingInfo.recordingUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <VideoOff className="w-5 h-5" />
            録画なし
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">このセッションには録画がありません。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          録画
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {getExpirationBadge()}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <video
            controls
            className="w-full rounded-lg"
            style={{ maxHeight: "400px" }}
          >
            <source src={recordingInfo.recordingUrl} type="video/webm" />
            <source src={recordingInfo.recordingUrl} type="video/mp4" />
            お使いのブラウザは動画の再生をサポートしていません。
          </video>

          {/* 分単位の期限切れ警告（フリープランのテスト用） */}
          {recordingInfo.minutesUntilExpiration !== null &&
            recordingInfo.minutesUntilExpiration !== undefined &&
            recordingInfo.minutesUntilExpiration <= 10 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Clock className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm text-red-800">
                    この録画は{recordingInfo.minutesUntilExpiration}
                    分後に自動削除されます。
                  </p>
                  <p className="text-xs text-red-700">
                    フリープランのテスト用短期保存です。重要な録画は他の方法で保存してください。
                  </p>
                </div>
              </div>
            )}

          {/* 日単位の期限切れ警告（通常プラン用） */}
          {recordingInfo.daysUntilExpiration &&
            recordingInfo.daysUntilExpiration <= 7 &&
            (recordingInfo.minutesUntilExpiration === null ||
              recordingInfo.minutesUntilExpiration === undefined) && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-sm text-amber-800">
                    この録画は{recordingInfo.daysUntilExpiration}
                    日後に自動削除されます。
                  </p>
                  <p className="text-xs text-amber-700">
                    必要に応じて、録画を保存するか上位プランへのアップグレードをご検討ください。
                  </p>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};
