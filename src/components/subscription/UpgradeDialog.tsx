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
import {
  getPlanDescription,
  getPlanName,
  PLAN_LIMITS,
} from "@/lib/subscription-limits";
import { PlanType } from "@prisma/client";
import { Calendar, Crown, Users, Video } from "lucide-react";
import Link from "next/link";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanType;
  limitType: "recording" | "participants";
  currentCount: number;
  maxCount: number;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  currentPlan,
  limitType,
  currentCount,
  maxCount,
}: UpgradeDialogProps) {
  const limitTypeText = limitType === "recording" ? "録画" : "参加者";
  const limitIcon =
    limitType === "recording" ? (
      <Video className="h-4 w-4" />
    ) : (
      <Users className="h-4 w-4" />
    );

  const getUpgradeOptions = () => {
    const options = [];

    if (currentPlan === "FREE") {
      options.push("BASIC", "PRO");
    } else if (currentPlan === "BASIC") {
      options.push("PRO");
    }

    return options;
  };

  const upgradeOptions = getUpgradeOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            プランをアップグレード
          </DialogTitle>
          <DialogDescription>
            {limitTypeText}
            の上限に達しました。より多くの機能を利用するためにプランをアップグレードしませんか？
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 現在の状況 */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {limitIcon}
                <span className="font-medium">現在の利用状況</span>
              </div>
              <Badge variant="secondary">
                {getPlanName(currentPlan)}プラン
              </Badge>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {limitTypeText}: {currentCount}/{maxCount} (
              {limitType === "recording" ? "今日" : "ルーム"})
            </div>
          </div>

          {/* アップグレードオプション */}
          <div className="space-y-3">
            <h4 className="font-medium">おすすめプラン</h4>
            {upgradeOptions.map((plan) => {
              const planType = plan as PlanType;
              const limits = PLAN_LIMITS[planType];

              return (
                <div
                  key={plan}
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{getPlanName(planType)}</h5>
                        <Badge
                          variant={plan === "PRO" ? "default" : "secondary"}
                        >
                          ¥{limits.price}/月
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getPlanDescription(planType)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span>録画 {limits.maxDailyRecordings}件/日</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>参加者 {limits.maxParticipants}人</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>保存 {limits.recordingRetentionDays}日</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            後で
          </Button>
          <Link href="/pricing">
            <Button onClick={() => onOpenChange(false)}>プランを選択</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
