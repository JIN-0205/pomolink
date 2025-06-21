"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanType } from "@/lib/subscription-limits";
import { PricingTable, useUser } from "@clerk/nextjs";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface PlanInfo {
  planType: PlanType;
  planName: string;
  planLimits: {
    maxRooms: number;
    maxDailyRecordings: number;
    maxParticipants: number;
    recordingRetentionDays: number;
    price: number;
  };
}

export default function Page() {
  const { user, isLoaded } = useUser();
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPlanInfo = async (showRefreshState = false) => {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/subscription/plan");
      console.log(
        "\u001b[35m" + "Fetching plan info from /api/subscription/plan"
      );
      if (response.ok) {
        const data = await response.json();
        setPlanInfo(data);
      } else {
        console.error("Failed to fetch plan info:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching plan info:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchPlanInfo();
    }
  }, [isLoaded, user]);

  const handleRefresh = () => {
    fetchPlanInfo(true);
  };

  // Clerkの権限チェック（フォールバック用）
  const hasPremiumAccess =
    user?.hasVerifiedEmailAddress &&
    user?.publicMetadata?.plan === "premium_user";
  const hasBasicAccess =
    user?.hasVerifiedEmailAddress &&
    user?.publicMetadata?.plan === "basic_user";

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1rem" }}>
      {/* プラン情報表示セクション */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">現在のプラン</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            更新
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            プラン情報を読み込み中...
          </div>
        ) : planInfo ? (
          <div className="flex items-center gap-3">
            <Badge
              variant={
                planInfo.planType === "PREMIUM"
                  ? "default"
                  : planInfo.planType === "BASIC"
                    ? "secondary"
                    : "outline"
              }
            >
              {planInfo.planName}プラン
            </Badge>
            <div className="text-sm text-gray-600">
              ルーム: {planInfo.planLimits.maxRooms}個 | 参加者:{" "}
              {planInfo.planLimits.maxParticipants}人 | 録画:{" "}
              {planInfo.planLimits.maxDailyRecordings}回/日
            </div>
          </div>
        ) : (
          <div className="text-gray-600">プラン情報を取得できませんでした</div>
        )}
      </div>

      {/* Clerk PricingTable */}
      <PricingTable
        newSubscriptionRedirectUrl="/pricing/success"
        appearance={{
          elements: {
            commerce: {
              billedMonthlyOnly: "Billed annually",
            },
          },
          variables: {
            colorPrimary: "#4F46E5", // Tailwind Indigo 600
            colorText: "#111827", // Tailwind Gray 900
            colorBackground: "#FFFFFF", // Tailwind White
          },
        }}
      />

      {/* プラン別メッセージ */}
      {planInfo ? (
        <div className="mt-6">
          {planInfo.planType === "PREMIUM" ? (
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-purple-800 font-medium">
                🎉 Premiumプランの全機能をお楽しみください！
              </p>
              <p className="text-purple-600 text-sm mt-1">
                最大{planInfo.planLimits.maxParticipants}人での協働、
                {planInfo.planLimits.maxDailyRecordings}回/日の録画が可能です
              </p>
            </div>
          ) : planInfo.planType === "BASIC" ? (
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 font-medium">
                ⭐ Basicプランをご利用中です
              </p>
              <p className="text-blue-600 text-sm mt-1">
                より多くの機能をお求めの場合は、Premiumプランをご検討ください
              </p>
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-800 font-medium">
                無料プランをご利用中です
              </p>
              <p className="text-gray-600 text-sm mt-1">
                より多くの機能とストレージ容量をお楽しみいただくために、有料プランをご検討ください
              </p>
            </div>
          )}
        </div>
      ) : (
        // フォールバック表示（Clerkの権限情報を使用）
        <div className="mt-6">
          {hasPremiumAccess ? (
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-800">
                Premiumプランの機能をお楽しみください。
              </p>
            </div>
          ) : hasBasicAccess ? (
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                Basicプランの機能をお楽しみください。
              </p>
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-800">
                プランを選択して、機能をアンロックしてください。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
