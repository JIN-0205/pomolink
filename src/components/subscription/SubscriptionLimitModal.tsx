"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLAN_BENEFITS } from "@/lib/subscription-limits";
import { PlanType } from "@prisma/client";

import { Crown, FolderPlus, Users, Video } from "lucide-react";

interface SubscriptionLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: "ROOM_CREATION" | "RECORDING" | "PARTICIPANT";
  currentPlan: PlanType;
  currentCount: number;
  maxCount: number;
  onUpgrade: () => void;
  userRole?: "PLANNER" | "PERFORMER";
  roomOwnerName?: string;
  recordingLimitType?: "USER" | "ROOM";
  customMessage?: string;
}

const LIMIT_CONFIG = {
  ROOM_CREATION: {
    icon: FolderPlus,
    title: "ルーム作成数の上限に達しました",
    description: "作成できるルーム数の上限に達しています。",
  },
  RECORDING: {
    icon: Video,
    title: "録画制限に達しました",
    description: "本日の録画回数の上限に達しています。",
  },
  PARTICIPANT: {
    icon: Users,
    title: "参加者数の上限に達しました",
    description: "このルームの参加者数の上限に達しています。",
  },
};

export function SubscriptionLimitModal({
  isOpen,
  onClose,
  limitType,
  currentPlan,
  currentCount,
  maxCount,
  onUpgrade,
  userRole = "PLANNER",
  roomOwnerName,
  recordingLimitType,
  customMessage,
}: SubscriptionLimitModalProps) {
  const config = LIMIT_CONFIG[limitType];
  const Icon = config.icon;

  const isPerformer = userRole === "PERFORMER";
  const isParticipantLimit = limitType === "PARTICIPANT";
  const isRoomRecordingLimit =
    limitType === "RECORDING" && recordingLimitType === "ROOM";

  const getRecommendedPlan = () => {
    if (currentPlan === PlanType.FREE) return PlanType.BASIC;
    return PlanType.PREMIUM;
  };

  const getDescription = () => {
    if (customMessage) return customMessage;
    if (isRoomRecordingLimit) {
      return "このルームの本日の録画回数制限に達しています。制限はルーム作成者のプランによって決まります。";
    }
    return config.description;
  };

  const recommendedPlan = getRecommendedPlan();
  const planInfo = PLAN_BENEFITS[recommendedPlan];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5 text-orange-500" />
            <DialogTitle className="text-lg">{config.title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-orange-800">
              現在の{isParticipantLimit ? "参加者数" : "使用状況"}:{" "}
              <span className="font-semibold">
                {currentCount}/{maxCount}
              </span>
            </div>
            {roomOwnerName && (
              <div className="text-sm text-orange-800 mt-1">
                ルームオーナー: {roomOwnerName}
              </div>
            )}
            <Badge variant="outline" className="mt-1">
              {currentPlan === PlanType.FREE
                ? "フリープラン"
                : currentPlan === PlanType.BASIC
                  ? "ベーシックプラン"
                  : "プレミアムプラン"}
            </Badge>
          </div>

          {/* パフォーマー向けの説明を追加 */}
          {isPerformer && isParticipantLimit && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800 font-medium">
                参加者数の制限について
              </div>
              <div className="text-sm text-blue-800 mt-1">
                参加者数の上限は、ルームを作成したプランナーのサブスクリプションプランによって決まります。
                この制限を解除するには、ルームオーナー（
                {roomOwnerName || "プランナー"}
                ）がプランをアップグレードする必要があります。
              </div>
            </div>
          )}
        </div>

        {/* プランナーの場合のみアップグレード情報を表示 */}
        {!isPerformer && (
          <div className="py-4">
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  {planInfo.name}にアップグレード
                </h3>
              </div>
              <p className="text-2xl font-bold text-blue-900 mb-2">
                {planInfo.price}
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                {planInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span className="text-blue-600">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="sm:w-auto w-full"
          >
            {isPerformer ? "閉じる" : "後で決める"}
          </Button>
          {/* プランナーの場合のみアップグレードボタンを表示 */}
          {!isPerformer && (
            <Button
              onClick={onUpgrade}
              className="sm:w-auto w-full bg-blue-600 hover:bg-blue-700"
            >
              今すぐアップグレード
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
