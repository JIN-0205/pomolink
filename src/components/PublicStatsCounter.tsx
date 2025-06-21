"use client";

import { PublicStats } from "@/types";
import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";

export function PublicStatsCounter() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        console.log("統計データを取得中...");

        const response = await fetch("/api/public/stats");
        console.log("APIレスポンス:", response.status, response.statusText);

        if (!response.ok) {
          throw new Error(
            `統計データの取得に失敗しました: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("統計データ:", data);
        setStats(data);
      } catch (err) {
        console.error("統計データ取得エラー:", err);
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 text-center">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-gray-400">---</div>
            <p className="text-sm text-gray-500">完了ポモドーロ数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-gray-400">---</div>
            <p className="text-sm text-gray-500">参加ルーム数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-gray-400">---</div>
            <p className="text-sm text-gray-500">ユーザー数</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {stats.totalCompletedPomodoros.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">完了ポモドーロ数</p>
          <p className="text-xs text-gray-500 mt-1">みんなで集中した時間</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.totalRooms.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">参加ルーム数</p>
          <p className="text-xs text-gray-500 mt-1">学習コミュニティ</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {stats.totalUsers.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">ユーザー数</p>
          <p className="text-xs text-gray-500 mt-1">一緒に頑張る仲間</p>
        </CardContent>
      </Card>
    </div>
  );
}
