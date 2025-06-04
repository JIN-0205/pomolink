"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getPlanName, PLAN_LIMITS } from "@/lib/subscription-limits";
import { PlanType } from "@prisma/client";
import { Calendar, Crown, Users, Video } from "lucide-react";
import Link from "next/link";

interface SubscriptionInfoProps {
  planType: PlanType;
  dailyRecordingCount: number;
  currentParticipants?: number;
  roomCount?: number;
}

export function SubscriptionInfo({
  planType,
  dailyRecordingCount,
  currentParticipants = 0,
  roomCount = 0,
}: SubscriptionInfoProps) {
  const limits = PLAN_LIMITS[planType];
  const planName = getPlanName(planType);

  const recordingProgress =
    (dailyRecordingCount / limits.maxDailyRecordings) * 100;
  const participantProgress =
    currentParticipants > 0
      ? (currentParticipants / limits.maxParticipants) * 100
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            サブスクリプション
          </div>
          <Badge variant={planType === "FREE" ? "secondary" : "default"}>
            {planName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* プラン詳細 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Video className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-sm font-medium">録画制限</div>
            <div className="text-lg font-bold">{limits.maxDailyRecordings}</div>
            <div className="text-xs text-muted-foreground">件/日</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-sm font-medium">参加者制限</div>
            <div className="text-lg font-bold">{limits.maxParticipants}</div>
            <div className="text-xs text-muted-foreground">人</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-sm font-medium">保存期間</div>
            <div className="text-lg font-bold">
              {limits.recordingRetentionDays}
            </div>
            <div className="text-xs text-muted-foreground">日</div>
          </div>
        </div>

        {/* 使用状況 */}
        <div className="space-y-4">
          <h4 className="font-medium">今日の使用状況</h4>

          {/* 録画使用状況 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                録画回数
              </span>
              <span>
                {dailyRecordingCount}/{limits.maxDailyRecordings}
              </span>
            </div>
            <Progress value={recordingProgress} className="h-2" />
            {dailyRecordingCount >= limits.maxDailyRecordings && (
              <p className="text-sm text-red-600">本日の録画制限に達しました</p>
            )}
          </div>

          {/* 参加者使用状況（ルーム参加時のみ表示） */}
          {roomCount > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  参加者数
                </span>
                <span>
                  {currentParticipants}/{limits.maxParticipants}
                </span>
              </div>
              <Progress value={participantProgress} className="h-2" />
              {currentParticipants >= limits.maxParticipants && (
                <p className="text-sm text-red-600">参加者の上限に達しました</p>
              )}
            </div>
          )}
        </div>

        {/* アップグレードボタン */}
        {planType !== "PRO" && (
          <div className="pt-4 border-t">
            <Link href="/pricing">
              <Button className="w-full">プランをアップグレード</Button>
            </Link>
          </div>
        )}

        {/* プランの価格表示 */}
        {planType !== "FREE" && (
          <div className="text-center text-sm text-muted-foreground">
            ¥{limits.price}/月
          </div>
        )}
      </CardContent>
    </Card>
  );
}
