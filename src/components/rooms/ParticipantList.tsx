// src/components/rooms/ParticipantList.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomParticipant, User } from "@/types";
import {
  Crown,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserCog,
  UserMinus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ParticipantListProps {
  roomId: string;
  participants: Array<RoomParticipant & { user: User }>;
  isPlanner: boolean;
  creatorId: string;
}

export function ParticipantList({
  roomId,
  participants,
  isPlanner,
  creatorId,
}: ParticipantListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // 検索とフィルタリングを適用
  const filteredParticipants = participants.filter((participant) => {
    // 検索クエリ
    const user = participant.user;
    const searchMatches =
      searchQuery === "" ||
      (user.name &&
        user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    // ロールフィルター
    const roleMatches = roleFilter === "ALL" || participant.role === roleFilter;

    return searchMatches && roleMatches;
  });

  const handleChangeRole = async (participantId: string, newRole: string) => {
    try {
      const response = await fetch(
        `/api/rooms/${roomId}/participants/${participantId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        throw new Error("ロールの変更に失敗しました");
      }

      toast("更新完了", {
        description: "参加者のロールを更新しました",
      });

      // ページをリフレッシュして最新の状態を取得
      router.refresh();
    } catch (error) {
      console.error(error);
      toast("エラー", {
        description: "ロールの変更に失敗しました",
      });
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm("このメンバーをルームから削除しますか？")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/participants/${participantId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("参加者の削除に失敗しました");
      }

      toast("削除完了", {
        description: "参加者をルームから削除しました",
      });

      // ページをリフレッシュして最新の状態を取得
      router.refresh();
    } catch (error) {
      console.error(error);
      toast("エラー", {
        description: "参加者の削除に失敗しました",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="参加者を検索..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="ロール" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">すべて</SelectItem>
            <SelectItem value="PLANNER">プランナー</SelectItem>
            <SelectItem value="PERFORMER">パフォーマー</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredParticipants.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-medium">参加者が見つかりません</h3>
          <p className="text-muted-foreground mt-1">
            検索条件に一致する参加者がいません
          </p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {filteredParticipants.map((participant) => {
            const isCreator = participant.userId === creatorId;
            const user = participant.user;

            return (
              <div
                key={participant.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={user.imageUrl || undefined} />
                    <AvatarFallback>
                      {user.name?.substring(0, 2) || user.email.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">{user.name || user.email}</p>
                      {isCreator && (
                        <Crown className="h-4 w-4 ml-2 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Badge
                    variant={participant.role === "PLANNER" ? "main" : "sub"}
                    className="mr-4"
                  >
                    {participant.role === "PLANNER" ? (
                      <ShieldCheck className="h-3 w-3 mr-1" />
                    ) : null}
                    {participant.role === "PLANNER"
                      ? "プランナー"
                      : "パフォーマー"}
                  </Badge>

                  {isPlanner && !isCreator && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeRole(
                              participant.id,
                              participant.role === "PLANNER"
                                ? "PERFORMER"
                                : "PLANNER"
                            )
                          }
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          {participant.role === "PLANNER"
                            ? "パフォーマーに変更"
                            : "プランナーに変更"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            handleRemoveParticipant(participant.id)
                          }
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
