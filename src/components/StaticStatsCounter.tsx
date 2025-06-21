"use client";

import { PublicStats } from "@/types";
import { Card, CardContent } from "./ui/card";

interface StaticStatsCounterProps {
  initialStats: PublicStats;
}

export function StaticStatsCounter({ initialStats }: StaticStatsCounterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {initialStats.totalCompletedPomodoros.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">完了ポモドーロ数</p>
          <p className="text-xs text-gray-500 mt-1">みんなで集中した時間</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {initialStats.totalRooms.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">参加ルーム数</p>
          <p className="text-xs text-gray-500 mt-1">学習コミュニティ</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {initialStats.totalUsers.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">ユーザー数</p>
          <p className="text-xs text-gray-500 mt-1">一緒に頑張る仲間</p>
        </CardContent>
      </Card>
    </div>
  );
}
