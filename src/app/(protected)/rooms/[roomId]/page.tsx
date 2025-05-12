"use client";

import { InviteCodeDisplay } from "@/components/rooms/InviteCodeDisplay";
import { InviteModal } from "@/components/rooms/InviteModal";
import { ParticipantList } from "@/components/rooms/ParticipantList";
import { ShareRoomDialog } from "@/components/rooms/ShareRoomDialog";
import { TaskList } from "@/components/tasks/TaskList";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomWithParticipants, Task } from "@/types";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  LogOut,
  PlusCircle,
  Settings,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "overview";
  const { user } = useUser();
  useEffect(() => {
    console.log(user);
  }, [user]);

  const [room, setRoom] = useState<RoomWithParticipants | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDbId = async () => {
      if (!user?.id) return;

      try {
        const res = await fetch(`/api/users/me`);
        if (res.ok) {
          const userData = await res.json();
          setCurrentUserDbId(userData.id);
        }
      } catch (error) {
        console.error("ユーザー情報取得エラー:", error);
      }
    };

    fetchUserDbId();
  }, [user?.id]);

  // ルーム情報を取得
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/rooms/${roomId}`);
        if (!res.ok) throw new Error("ルームの取得に失敗しました");

        const data = await res.json();
        setRoom(data);

        // タスク情報も取得
        const tasksRes = await fetch(`/api/rooms/${roomId}/tasks`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData);
        }
      } catch (error) {
        console.error(error);
        toast("エラー", {
          description: "ルーム情報の取得に失敗しました",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  // ルームから退出する処理
  const handleLeaveRoom = async () => {
    if (!confirm("このルームから退出しますか？この操作は取り消せません。")) {
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${roomId}/leave`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("ルームからの退出に失敗しました");
      }

      toast("退出完了", {
        description: "ルームから退出しました",
      });

      router.push("/rooms");
    } catch (error) {
      console.error(error);
      toast("エラー", {
        description: "ルームからの退出に失敗しました",
      });
    }
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-4 animate-pulse">
          <div className="h-12 w-48 bg-muted rounded-md"></div>
          <div className="h-6 w-24 bg-muted rounded-full"></div>
        </div>
        <div className="h-4 w-full bg-muted rounded-md mt-4"></div>
        <div className="h-4 w-2/3 bg-muted rounded-md mt-2"></div>

        <div className="mt-8">
          <div className="h-10 w-80 bg-muted rounded-md"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">ルームが見つかりません</h2>
          <p className="text-muted-foreground mt-2">
            このルームは存在しないか、アクセス権限がありません
          </p>
          <Button onClick={() => router.push("/rooms")} className="mt-4">
            ルーム一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  // ユーザーが持つ権限を確認
  const currentUserParticipant = room.participants.find(
    (p) => p.userId === currentUserDbId
  );
  const isCreator = room.creatorId === currentUserDbId;
  const isPlanner = currentUserParticipant?.role === "PLANNER" || isCreator;

  // 統計情報の計算
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalCompletedPomos = tasks.reduce(
    (sum, task) => sum + (task.completedPomos || 0),
    0
  );

  return (
    <div className="container py-6">
      {/* ルームヘッダー */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{room.name}</h1>
            {room.isPrivate ? (
              <Badge>非公開</Badge>
            ) : (
              <Badge variant="outline">公開</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            作成日:{" "}
            {format(new Date(room.createdAt), "yyyy年MM月dd日", { locale: ja })}
          </p>
          {room.description && (
            <p className="mt-2 text-sm">{room.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {isPlanner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              招待
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="mr-2 h-4 w-4" />
            共有
          </Button>

          {isPlanner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/rooms/${roomId}/settings`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              設定
            </Button>
          )}

          {!isCreator && (
            <Button variant="outline" size="sm" onClick={handleLeaveRoom}>
              <LogOut className="mr-2 h-4 w-4" />
              退出
            </Button>
          )}
        </div>
      </div>

      {/* タブナビゲーション */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="tasks">タスク</TabsTrigger>
          <TabsTrigger value="participants">参加者</TabsTrigger>
        </TabsList>

        {/* 概要タブ */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 統計カード */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-indigo-900">
                  統計情報
                </CardTitle>
                <p className="text-sm text-gray-500">このルームの現在の状況</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg">
                    <div className="p-2 bg-white rounded-full mb-2 shadow-sm">
                      <Users className="h-6 w-6 text-indigo-500" />
                    </div>
                    <span className="text-2xl font-bold text-indigo-700">
                      {room.participants.length}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">参加者</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg">
                    <div className="p-2 bg-white rounded-full mb-2 shadow-sm">
                      <CheckCircle className="h-6 w-6 text-indigo-500" />
                    </div>
                    <span className="text-2xl font-bold text-indigo-700">
                      {completedTasks}/{tasks.length}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      完了タスク
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg">
                    <div className="p-2 bg-white rounded-full mb-2 shadow-sm">
                      <Clock className="h-6 w-6 text-indigo-500" />
                    </div>
                    <span className="text-2xl font-bold text-indigo-700">
                      {totalCompletedPomos}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      完了ポモドーロ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 参加者カード */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold text-indigo-900">
                    参加者
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    メンバー {room.participants.length}人
                  </CardDescription>
                </div>
                {isPlanner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-500 hover:text-indigo-700"
                    onClick={() => setActiveTab("participants")}
                  >
                    <ChevronRight /> すべて表示
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {room.participants.slice(0, 5).map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="border-2 border-indigo-100">
                          <AvatarImage
                            src={participant.user.imageUrl || undefined}
                            alt={participant.user.name || "ユーザー"}
                          />
                          <AvatarFallback>
                            {participant.user.name?.substring(0, 2) || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.user.name}</p>
                          <p className="text-sm text-gray-500">
                            {participant.role === "PLANNER"
                              ? "プランナー"
                              : "パフォーマー"}
                          </p>
                        </div>
                      </div>

                      {participant.userId === room.creatorId && (
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-700"
                        >
                          作成者
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 最近のタスクカード */}
            {/* <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>最近のタスク</CardTitle>
                  <CardDescription>最近の活動状況</CardDescription>
                </div>
                {isPlanner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/rooms/${roomId}/tasks/create`)}
                  >
                    新規タスク
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() =>
                          router.push(`/rooms/${roomId}/tasks/${task.id}`)
                        }
                      >
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {task.estimatedPomos} ポモドーロ •
                            {task.status === "COMPLETED"
                              ? " 完了"
                              : task.status === "IN_PROGRESS"
                                ? " 進行中"
                                : " 未着手"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            task.priority === "HIGH"
                              ? "destructive"
                              : task.priority === "MEDIUM"
                                ? "main"
                                : "sub"
                          }
                        >
                          {task.priority === "HIGH"
                            ? "高"
                            : task.priority === "MEDIUM"
                              ? "中"
                              : "低"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      タスクがまだありません
                    </p>
                    {isPlanner && (
                      <Button
                        className="mt-2"
                        onClick={() =>
                          router.push(`/rooms/${roomId}/tasks/create`)
                        }
                      >
                        最初のタスクを作成
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card> */}
            <Card className="md:col-span-2 border-0 shadow-sm">
              <CardHeader className="flex items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    最近のタスク
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    最近の活動状況
                  </CardDescription>
                </div>
                {isPlanner && (
                  <Button
                    className="flex items-center font-semibold bg-indigo-500 hover:bg-indigo-600 text-white"
                    onClick={() => router.push(`/rooms/${roomId}/tasks/create`)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    新規タスク
                  </Button>
                )}
              </CardHeader>

              <CardContent className="pt-4">
                {tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => {
                      // pick icon & status text
                      let StatusIcon = Clock;
                      let statusText = "未着手";
                      if (task.status === "COMPLETED") {
                        StatusIcon = CheckCircle;
                        statusText = "完了";
                      } else if (task.status === "IN_PROGRESS") {
                        StatusIcon = AlertCircle;
                        statusText = "進行中";
                      }
                      // pick badge color
                      const badgeClasses =
                        task.priority === "HIGH"
                          ? "bg-red-500 hover:bg-red-600"
                          : task.priority === "MEDIUM"
                            ? "bg-indigo-500 hover:bg-indigo-600"
                            : "bg-green-500 hover:bg-green-600";
                      const badgeLabel =
                        task.priority === "HIGH"
                          ? "高"
                          : task.priority === "MEDIUM"
                            ? "中"
                            : "低";

                      return (
                        <div
                          key={task.id}
                          className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow cursor-pointer"
                          onClick={() =>
                            router.push(`/rooms/${roomId}/tasks/${task.id}`)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium text-gray-900">
                                {task.title}
                              </h4>
                              <div className="flex items-center text-sm text-gray-500">
                                <StatusIcon className="mr-1 h-4 w-4 text-gray-400" />
                                {task.estimatedPomos} ポモドーロ・{statusText}
                              </div>
                            </div>
                            <Badge className={badgeClasses}>{badgeLabel}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">
                      タスクがまだありません
                    </p>
                    {isPlanner && (
                      <Button
                        className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white"
                        onClick={() =>
                          router.push(`/rooms/${roomId}/tasks/create`)
                        }
                      >
                        最初のタスクを作成
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* タスクタブ */}
        <TabsContent value="tasks">
          <TaskList roomId={roomId as string} isPlanner={isPlanner} />
        </TabsContent>

        {/* 参加者タブ */}
        <TabsContent value="participants">
          <div className="space-y-6">
            {/* 招待セクション - 管理者/プランナーのみ表示 */}
            {isPlanner && room && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">メンバーを招待</h3>

                {/* 招待コード表示コンポーネント */}
                <InviteCodeDisplay
                  roomId={roomId as string}
                  initialCode={room.inviteCode}
                />

                {/* メール招待ボタン */}
                <div className="mt-4">
                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    メールで招待
                  </Button>
                </div>
              </div>
            )}

            {/* 参加者リスト */}
            <div className="mt-8">
              <ParticipantList
                roomId={roomId as string}
                participants={room.participants}
                isPlanner={isPlanner}
                creatorId={room.creatorId}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* モーダル */}
      {showInviteModal && (
        <InviteModal
          roomId={roomId as string}
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {room && showShareDialog && (
        <ShareRoomDialog
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          inviteCode={room.inviteCode}
          roomName={room.name}
          roomId={roomId as string}
        />
      )}
    </div>
  );
}
