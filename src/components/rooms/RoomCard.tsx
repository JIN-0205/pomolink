import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Room } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronRight, Clock, Crown, Target, Users, Zap } from "lucide-react";
import Link from "next/link";

interface RoomCardProps {
  room: Room;
  participantCount?: number;
  role?: "PLANNER" | "PERFORMER";
  activePomodoros?: number;
  completedTasks?: number;
}

export function RoomCard({
  room,
  participantCount = 0,
  role,
  activePomodoros = 0,
  completedTasks = 0,
}: RoomCardProps) {
  const isPlanner = role === "PLANNER";

  return (
    <Link href={`/rooms/${room.id}`} className="group">
      <Card
        className={cn(
          "h-full overflow-hidden transition-all duration-300 hover-lift border-0 shadow-md",
          "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
          "group-hover:shadow-xl group-hover:scale-[1.02] py-0 rounded-md"
        )}
      >
        {/* カードヘッダー */}
        <CardHeader className="pb-3 relative pt-4">
          {/* 背景装飾 */}
          <div
            className={cn(
              "absolute -top-px left-0 right-0 h-2 rounded-t-md",
              isPlanner
                ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                : "bg-gradient-to-r from-green-500 to-blue-500"
            )}
          />

          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {room.name}
              </CardTitle>
              <CardDescription className="mt-1 text-sm line-clamp-2">
                {room.description || "説明はありません"}
              </CardDescription>
            </div>

            <div className="ml-3 flex items-center">
              {role && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-semibold",
                    isPlanner
                      ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300"
                      : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300"
                  )}
                >
                  {isPlanner ? (
                    <>
                      <Crown className="mr-1 h-3 w-3" />
                      プランナー
                    </>
                  ) : (
                    <>
                      <Zap className="mr-1 h-3 w-3" />
                      パフォーマー
                    </>
                  )}
                </Badge>
              )}
              <ChevronRight className="ml-2 h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </CardHeader>

        {/* 統計情報 */}
        <CardContent className="pt-0 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-3">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {participantCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  参加者
                </div>
              </div>
            </div>

            <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full mr-3">
                <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {completedTasks}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  完了タスク
                </div>
              </div>
            </div>
          </div>

          {/* アクティブ状態インジケーター */}
          {activePomodoros > 0 && (
            <div className="mt-3 flex items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                {activePomodoros}人が集中中
              </span>
            </div>
          )}

          {/* プライベート/パブリック表示 */}
          <div className="mt-3 flex items-center justify-between">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                room.isPrivate
                  ? "border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:bg-orange-900/20"
                  : "border-green-200 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-900/20"
              )}
            >
              {room.isPrivate ? "非公開" : "公開"}
            </Badge>

            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {format(new Date(room.createdAt), "MM/dd", { locale: ja })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
