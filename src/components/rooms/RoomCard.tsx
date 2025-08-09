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
  participantCount: number;
  role: "PLANNER" | "PERFORMER";
  completedTasks: number;
}

export function RoomCard({
  room,
  participantCount,
  role,
  completedTasks,
}: RoomCardProps) {
  const isPlanner = role === "PLANNER";

  return (
    <Link href={`/rooms/${room.id}`} className="group">
      <Card
        className={cn(
          "h-full overflow-hidden transition-all duration-300 hover-lift border-0 shadow-md",
          "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
          "group-hover:shadow-xl group-hover:scale-[1.02] py-0 rounded-r-xs"
        )}
      >
        {/* カードヘッダー */}
        <CardHeader className="pb-3 relative pt-4">
          {/* 背景装飾 */}
          <div
            className={cn(
              "absolute left-0 right-0 h-2 ",
              isPlanner
                ? "bg-gradient-to-r from-indigo-200 to-indigo-500"
                : // ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                  "bg-gradient-to-r from-green-200 to-green-500"
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

          {/* 作成日 */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {format(new Date(room.createdAt), "yyyy/MM/dd", { locale: ja })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
