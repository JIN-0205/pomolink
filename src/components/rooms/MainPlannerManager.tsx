"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomParticipant, User } from "@/types";
import { Crown, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface MainPlannerManagerProps {
  roomId: string;
  currentMainPlanner: User | null;
  isCreator: boolean;
  currentUserId: string; // 現在のユーザーIDを追加
  planners: Array<RoomParticipant & { user: User }>;
}

export function MainPlannerManager({
  roomId,
  currentMainPlanner,
  isCreator,
  currentUserId,
  planners,
}: MainPlannerManagerProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPlannerId, setSelectedPlannerId] = useState(
    currentMainPlanner?.id || "none"
  );

  // メインプランナーのみが譲渡可能、ただし未設定の場合はルーム作成者が設定可能
  const hasMainPlanner = currentMainPlanner !== null;
  const canChangeMainPlanner = hasMainPlanner
    ? currentMainPlanner?.id === currentUserId // メインプランナーが設定済みの場合、現在のメインプランナーのみ
    : isCreator; // 未設定の場合、ルーム作成者のみ

  const handleUpdateMainPlanner = async () => {
    if (!canChangeMainPlanner) {
      const errorMessage = hasMainPlanner
        ? "現在のメインプランナーのみが権限を譲渡できます。"
        : "ルーム作成者のみがメインプランナーを設定できます。";

      toast.error("権限がありません", {
        description: errorMessage,
      });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/rooms/${roomId}/main-planner`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mainPlannerId:
            selectedPlannerId === "none" ? null : selectedPlannerId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();

      toast.success("更新完了", {
        description: data.message,
      });

      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("エラー", {
        description: "メインプランナーの更新に失敗しました",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <CardTitle>メインプランナー</CardTitle>
          </div>
          {canChangeMainPlanner && (
            <Settings className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <CardDescription>
          ルームの主要な管理者です。タスク提案の承認や重要な決定を行います。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 現在のメインプランナー表示 */}
        {currentMainPlanner ? (
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Avatar>
              <AvatarImage src={currentMainPlanner.imageUrl || undefined} />
              <AvatarFallback>
                {currentMainPlanner.name?.substring(0, 2) ||
                  currentMainPlanner.email.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className="font-medium">
                  {currentMainPlanner.name || currentMainPlanner.email}
                </p>
                <Badge
                  variant="outline"
                  className="text-yellow-700 border-yellow-300"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  メインプランナー
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentMainPlanner.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>メインプランナーが設定されていません</p>
          </div>
        )}

        {/* メインプランナー変更 (条件に応じて権限チェック) */}
        {canChangeMainPlanner && (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              {hasMainPlanner
                ? "メインプランナーを譲渡"
                : "メインプランナーを設定"}
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedPlannerId}
                onValueChange={setSelectedPlannerId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="プランナーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">設定しない</SelectItem>
                  {planners.map((participant) => (
                    <SelectItem
                      key={participant.id}
                      value={participant.user.id}
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={participant.user.imageUrl || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {participant.user.name?.substring(0, 2) ||
                              participant.user.email.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {participant.user.name || participant.user.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleUpdateMainPlanner}
                disabled={
                  isUpdating ||
                  selectedPlannerId === (currentMainPlanner?.id || "none")
                }
                size="sm"
              >
                {isUpdating ? "更新中..." : "更新"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              メインプランナーは特別な権限を持ち、タスク提案の最終承認などを行います。
              {hasMainPlanner
                ? currentMainPlanner?.id === currentUserId
                  ? " あなたは現在メインプランナーです。権限を他のプランナーに譲渡できます。"
                  : " 現在のメインプランナーのみが権限を譲渡できます。"
                : " ルーム作成者がメインプランナーを設定できます。"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
