"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlanName, PLAN_LIMITS, PlanType } from "@/lib/subscription-limits";
import { useUser } from "@clerk/nextjs";

import {
  Award,
  CheckCircle,
  ChevronRight,
  ChevronsRight,
  Crown,
  Handshake,
  PlayCircle,
  Users,
  Video,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SubscriptionSuccessPage() {
  const { user } = useUser();

  const [planInfo, setPlanInfo] = useState<{
    planType: PlanType;
    planName: string;
    planLimits:
      | typeof PLAN_LIMITS.FREE
      | typeof PLAN_LIMITS.BASIC
      | typeof PLAN_LIMITS.PREMIUM;
  } | null>(null);

  useEffect(() => {
    // プラン情報を取得
    const fetchPlanInfo = async () => {
      try {
        const response = await fetch("/api/subscription/plan");
        if (response.ok) {
          const data = await response.json();
          setPlanInfo(data);
        }
      } catch (error) {
        console.error("Failed to fetch plan info:", error);
        // フォールバック: BASICプランとして表示
        setPlanInfo({
          planType: "BASIC",
          planName: getPlanName("BASIC"),
          planLimits: PLAN_LIMITS.BASIC,
        });
      }
    };

    fetchPlanInfo();
  }, []);

  const getFeatures = () => {
    if (!planInfo) return [];

    const { planLimits } = planInfo;

    return [
      {
        icon: Video,
        title: "高画質録画",
        description: `1日最大${planLimits.maxDailyRecordings}回の録画が可能`,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
      },
      {
        icon: Users,
        title: "チーム参加",
        description: `最大${planLimits.maxParticipants}人まで同時参加可能`,
        color: "text-green-500",
        bgColor: "bg-green-50",
      },
      {
        icon: Handshake,
        title: "ルーム作成",
        description: `最大${planLimits.maxRooms}個のルームを作成可能`,
        color: "text-purple-500",
        bgColor: "bg-purple-50",
      },
      {
        icon: Award,
        title: "データ保持",
        description: `${planLimits.recordingRetentionDays}日間のデータ保持`,
        color: "text-orange-500",
        bgColor: "bg-orange-50",
      },
    ];
  };

  const features = getFeatures();

  const quickActions = [
    {
      title: "ダッシュボードを見る",
      description: "今日の統計と進捗を確認",
      href: "/dashboard",
      icon: ChevronsRight,
      variant: "main" as const,
    },
    {
      title: "ルームを作成",
      description: "最初のプレミアムルームを作成",
      href: "/rooms/create",
      icon: PlayCircle,
      variant: "outline" as const,
    },
    {
      title: "チームを招待",
      description: "メンバーを招待してコラボレーション開始",
      href: "/rooms",
      icon: Users,
      variant: "outline" as const,
    },
  ];

  if (!planInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">プラン情報を読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* メインヘッダー */}
        <div className="text-center space-y-6">
          {/* 成功アイコン */}
          <div className="relative">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2"></div>
          </div>

          {/* タイトルと説明 */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              サブスクリプションが完了しました！
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {user?.firstName}さん、PomoLink{planInfo.planName}
              プランへようこそ！
              <br />
              これで全ての機能を使ってより効率的な集中時間を実現できます。
            </p>
          </div>
        </div>

        {/* プレミアム機能 */}
        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                {planInfo.planName}機能アンロック
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              これらの機能が利用可能になりました
            </CardTitle>
            <CardDescription className="text-gray-600">
              {planInfo.planName}プランで生産性を最大化しましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className={`p-3 rounded-full ${feature.bgColor}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* クイックアクション - CTA風デザイン */}
        <div className="text-center space-y-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-yellow-300" />
            <h2 className="text-3xl font-bold">今すぐ始めましょう</h2>
          </div>
          <p className="text-indigo-100 max-w-2xl mx-auto text-lg">
            これらのアクションでPomoLinkを最大限活用できます。
            {planInfo.planName}
            の機能で集中力を向上させ、チームと一緒により多くのことを達成しましょう。
          </p>

          {/* クイックアクションボタングリッド */}
          <div className="grid gap-4 max-w-4xl mx-auto mt-8">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="flex items-center justify-between p-6 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-white text-lg group-hover:text-yellow-200 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-indigo-100 text-sm">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/70 group-hover:text-yellow-200 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* サポート情報 */}
        <div className="text-center space-y-4 py-6">
          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
            サポートが必要な場合は、いつでもお気軽にお問い合わせください。
          </div>
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <Link
              href="/support"
              className="hover:text-indigo-600 transition-colors"
            >
              サポートセンター
            </Link>
            <span>•</span>
            <Link
              href="/docs"
              className="hover:text-indigo-600 transition-colors"
            >
              使い方ガイド
            </Link>
            <span>•</span>
            <Link
              href="/settings"
              className="hover:text-indigo-600 transition-colors"
            >
              設定
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
