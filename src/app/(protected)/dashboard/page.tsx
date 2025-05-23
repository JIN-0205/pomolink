"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  PlayCircle,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalPomodoros: number;
  completedTasks: number;
  activeRooms: number;
  weeklyProgress: number;
  todayPomodoros: number;
  streak: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPomodoros: 0,
    completedTasks: 0,
    activeRooms: 0,
    weeklyProgress: 0,
    todayPomodoros: 0,
    streak: 0,
  });
  // const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // TODO: 実際のAPIから統計データを取得
    setStats({
      totalPomodoros: 156,
      completedTasks: 23,
      activeRooms: 3,
      weeklyProgress: 75,
      todayPomodoros: 4,
      streak: 7,
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ダッシュボード
          </h1>
          <p className="text-muted-foreground mt-2">
            今日も集中して取り組みましょう！
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="hover-lift">
            <Link href="/rooms">
              <Users className="mr-2 h-4 w-4" />
              ルームを見る
            </Link>
          </Button>
          <Button variant="outline" asChild className="hover-lift">
            <Link href="/rooms/create">
              <PlayCircle className="mr-2 h-4 w-4" />
              ポモドーロ開始
            </Link>
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              今日のポモドーロ
            </CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800 dark:text-red-200">
              {stats.todayPomodoros}
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">
              目標: 6ポモドーロ
            </p>
            <Progress
              value={(stats.todayPomodoros / 6) * 100}
              className="mt-2 h-2 bg-red-200"
            />
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              完了タスク
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {stats.completedTasks}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              今月の累計
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              参加ルーム
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {stats.activeRooms}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              アクティブなルーム
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              継続日数
            </CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {stats.streak}日
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              連続記録
            </p>
          </CardContent>
        </Card>
      </div>

      {/* メインコンテンツエリア */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 週間進捗 */}
        <Card className="lg:col-span-2 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              週間進捗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">今週の目標達成率</span>
                <Badge
                  variant="secondary"
                  className="bg-indigo-100 text-indigo-700"
                >
                  {stats.weeklyProgress}%
                </Badge>
              </div>
              <Progress value={stats.weeklyProgress} className="h-3" />
              <div className="grid grid-cols-7 gap-2 mt-4">
                {["月", "火", "水", "木", "金", "土", "日"].map(
                  (day, index) => (
                    <div key={day} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        {day}
                      </div>
                      <div
                        className={`h-8 rounded ${
                          index < 5 ? "bg-indigo-500" : "bg-gray-200"
                        }`}
                      />
                      <div className="text-xs mt-1">
                        {index < 5 ? "4" : "0"}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* クイックアクション */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              クイックアクション
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              asChild
              variant="outline"
              className="w-full justify-start hover-lift"
            >
              <Link href="/rooms/create">
                <PlayCircle className="mr-2 h-4 w-4" />
                新しいルームを作成
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start hover-lift"
            >
              <Link href="/join">
                <Users className="mr-2 h-4 w-4" />
                ルームに参加
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start hover-lift"
            >
              <Link href="/points">
                <Award className="mr-2 h-4 w-4" />
                ポイントを確認
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 最近のアクティビティ */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            最近のアクティビティ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "ポモドーロ完了",
                room: "プロジェクトA",
                time: "2時間前",
              },
              { action: "タスク完了", room: "学習グループ", time: "4時間前" },
              {
                action: "新しいルームに参加",
                room: "チーム開発",
                time: "1日前",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.room}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
