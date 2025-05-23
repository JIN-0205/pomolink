"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Room, User } from "@/types";
import { useUser } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ポイント履歴型
interface PointHistory {
  id: string;
  type: string;
  points: number;
  reason?: string;
  relatedTaskId?: string;
  createdAt: string;
}

// APIレスポンス型定義
interface ApiRoomItem {
  room: Room;
  participantCount: number;
  role: string;
}
interface ApiHistoriesResponse {
  histories: PointHistory[];
}
interface ApiPerformersResponse {
  performers: User[];
}

// ルーム一覧取得API
const fetchPlannerRooms = async (): Promise<Room[]> => {
  const res = await fetch("/api/rooms?role=PLANNER");
  if (!res.ok) return [];
  const data = (await res.json()) as ApiRoomItem[];
  return data.map((item) => item.room);
};

// ルーム一覧取得API (パフォーマーとして所属)
const fetchPerformerRooms = async (): Promise<Room[]> => {
  const res = await fetch("/api/rooms?role=PERFORMER");
  if (!res.ok) return [];
  const data = (await res.json()) as ApiRoomItem[];
  return data.map((item) => item.room);
};

// ルームごとのパフォーマー一覧取得API
const fetchRoomPerformers = async (roomId: string): Promise<User[]> => {
  const res = await fetch(`/api/rooms/${roomId}/performers`);
  if (!res.ok) return [];
  const data = (await res.json()) as ApiPerformersResponse;
  return data.performers;
};

// パフォーマーのポイント履歴取得API
const fetchUserPointHistories = async (
  userId: string
): Promise<PointHistory[]> => {
  const res = await fetch(`/api/points/user/${userId}`);
  if (!res.ok) return [];
  const data = (await res.json()) as ApiHistoriesResponse;
  return data.histories;
};

// 自分のルームごとのポイント履歴取得API
const fetchSelfHistoriesByRoom = async (
  roomId: string
): Promise<PointHistory[]> => {
  const res = await fetch(`/api/points/self?roomId=${roomId}`);
  if (!res.ok) return [];
  const data = (await res.json()) as ApiHistoriesResponse;
  return data.histories;
};

const PointsPage = () => {
  const { isLoaded } = useUser();

  // プランナーとしてのルーム管理用
  const [plannerRooms, setPlannerRooms] = useState<Room[]>([]);
  const [roomPerformers, setRoomPerformers] = useState<Record<string, User[]>>(
    {}
  );
  const [performerHistories, setPerformerHistories] = useState<{
    [userId: string]: PointHistory[];
  }>({});
  const [loadingPerformer, setLoadingPerformer] = useState<string | null>(null);

  // パフォーマーとしてのルーム用
  const [performerRooms, setPerformerRooms] = useState<Room[]>([]);
  const [performerRoomHistories, setPerformerRoomHistories] = useState<
    Record<string, PointHistory[]>
  >({});
  const [loadingPerformerRoom, setLoadingPerformerRoom] = useState<
    string | null
  >(null);

  // ポイント付与ダイアログの状態
  const [isAddPointDialogOpen, setIsAddPointDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedPerformer, setSelectedPerformer] = useState<User | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState<string>("");
  const [pointReason, setPointReason] = useState<string>("");
  const [isAddingPoints, setIsAddingPoints] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    // プランナーとしてのルーム一覧を取得
    fetchPlannerRooms().then((rooms) => {
      setPlannerRooms(rooms);
      // 各ルームのパフォーマー一覧を取得
      rooms.forEach((room) => {
        fetchRoomPerformers(room.id).then((performers) => {
          setRoomPerformers((prev) => ({ ...prev, [room.id]: performers }));
        });
      });
    });

    // パフォーマーとしてのルーム一覧を取得
    fetchPerformerRooms().then((rooms) => {
      setPerformerRooms(rooms);
      // 各ルームのポイント履歴を取得
      rooms.forEach((room) => {
        setLoadingPerformerRoom(room.id);
        fetchSelfHistoriesByRoom(room.id).then((histories) => {
          setPerformerRoomHistories((prev) => ({
            ...prev,
            [room.id]: histories,
          }));
          setLoadingPerformerRoom(null);
        });
      });
    });
  }, [isLoaded]);

  // パフォーマー名クリック時に履歴取得
  const handlePerformerClick = async (userId: string) => {
    if (!performerHistories[userId]) {
      setLoadingPerformer(userId);
      const histories = await fetchUserPointHistories(userId);
      setPerformerHistories((prev) => ({ ...prev, [userId]: histories }));
      setLoadingPerformer(null);
    }
  };

  // ポイント付与処理
  const handleAddPoints = async () => {
    if (!selectedRoom || !selectedPerformer || !pointsToAdd) {
      toast.error("必要な情報を入力してください");
      return;
    }

    const points = parseInt(pointsToAdd);
    if (isNaN(points) || points <= 0) {
      toast.error("有効なポイント数を入力してください");
      return;
    }

    setIsAddingPoints(true);
    try {
      const res = await fetch("/api/points/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedPerformer.id,
          roomId: selectedRoom.id,
          points,
          reason: pointReason || "プランナーからのボーナスポイント",
        }),
      });

      if (!res.ok) {
        throw new Error("ポイント付与に失敗しました");
      }

      toast.success("ポイントを付与しました");

      // ダイアログを閉じる
      setIsAddPointDialogOpen(false);
      setSelectedRoom(null);
      setSelectedPerformer(null);
      setPointsToAdd("");
      setPointReason("");

      // 該当パフォーマーの履歴を再取得
      if (selectedPerformer) {
        const updatedHistories = await fetchUserPointHistories(
          selectedPerformer.id
        );
        setPerformerHistories((prev) => ({
          ...prev,
          [selectedPerformer.id]: updatedHistories,
        }));
      }
    } catch (error) {
      console.error("ポイント付与エラー:", error);
      toast.error("ポイント付与に失敗しました");
    } finally {
      setIsAddingPoints(false);
    }
  };

  // ポイント履歴タイプの日本語化
  const formatPointType = (type: string) => {
    switch (type) {
      case "POMODORO_COMPLETE":
        return "ポモドーロ完了";
      case "SUBMISSION":
        return "課題提出";
      case "PLANNER_BONUS":
        return "プランナーボーナス";
      case "TASK":
        return "タスク完了";
      default:
        return type;
    }
  };

  // ポイント合計を計算する関数
  const calculateTotalPoints = (histories: PointHistory[]) => {
    return histories.reduce((sum, history) => sum + history.points, 0);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">ポイント管理</h1>

      <Tabs defaultValue="performer" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="performer">
            パフォーマーとしてのポイント
          </TabsTrigger>
          <TabsTrigger value="planner">プランナーとしての管理</TabsTrigger>
        </TabsList>

        {/* パフォーマーとしてのポイント表示 */}
        <TabsContent value="performer">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  パフォーマーとして獲得したポイント
                </h2>
                <p className="text-muted-foreground">
                  参加しているルームごとのポイント獲得状況
                </p>
              </div>
            </div>

            {performerRooms.length > 0 ? (
              <div className="space-y-6">
                {performerRooms.map((room) => (
                  <Card key={room.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{room.name}</span>
                        <span className="text-lg font-bold">
                          {performerRoomHistories[room.id]
                            ? `${calculateTotalPoints(
                                performerRoomHistories[room.id]
                              )} ポイント`
                            : "計算中..."}
                        </span>
                      </CardTitle>
                      <CardDescription>{room.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingPerformerRoom === room.id ? (
                        <div className="text-center py-4">読み込み中...</div>
                      ) : performerRoomHistories[room.id] &&
                        performerRoomHistories[room.id].length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="font-medium">最近のポイント履歴</h4>
                          {performerRoomHistories[room.id]
                            .slice(0, 10)
                            .map((history) => (
                              <div
                                key={history.id}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">
                                    {formatPointType(history.type)}
                                  </p>
                                  {history.reason && (
                                    <p className="text-sm text-muted-foreground">
                                      {history.reason}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(
                                      history.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-lg font-bold">
                                  +{history.points}
                                </div>
                              </div>
                            ))}
                          {performerRoomHistories[room.id].length > 10 && (
                            <div className="text-center text-sm text-muted-foreground">
                              他 {performerRoomHistories[room.id].length - 10}{" "}
                              件の履歴があります
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          まだポイント履歴がありません
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-muted-foreground">
                    パフォーマーとして参加しているルームがありません
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* プランナーとしての管理 */}
        <TabsContent value="planner">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  プランナーとして管理しているポイント
                </h2>
                <p className="text-muted-foreground">
                  管理しているルームのパフォーマーのポイント状況とポイント付与ができます
                </p>
              </div>
            </div>

            {plannerRooms.length > 0 ? (
              <div className="space-y-6">
                {plannerRooms.map((room) => (
                  <Card key={room.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{room.name}</span>
                        <Dialog
                          open={isAddPointDialogOpen}
                          onOpenChange={setIsAddPointDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedRoom(room)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              ポイント付与
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>ポイント付与</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>パフォーマー選択</Label>
                                <Select
                                  onValueChange={(value) => {
                                    const performer = roomPerformers[
                                      selectedRoom?.id || ""
                                    ]?.find((p) => p.id === value);
                                    setSelectedPerformer(performer || null);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="パフォーマーを選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roomPerformers[
                                      selectedRoom?.id || ""
                                    ]?.map((performer) => (
                                      <SelectItem
                                        key={performer.id}
                                        value={performer.id}
                                      >
                                        {performer.name || performer.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>ポイント数</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={pointsToAdd}
                                  onChange={(e) =>
                                    setPointsToAdd(e.target.value)
                                  }
                                  placeholder="付与するポイント数"
                                />
                              </div>
                              <div>
                                <Label>理由（任意）</Label>
                                <Input
                                  value={pointReason}
                                  onChange={(e) =>
                                    setPointReason(e.target.value)
                                  }
                                  placeholder="ポイント付与の理由"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsAddPointDialogOpen(false)}
                                >
                                  キャンセル
                                </Button>
                                <Button
                                  onClick={handleAddPoints}
                                  disabled={isAddingPoints}
                                >
                                  {isAddingPoints
                                    ? "付与中..."
                                    : "ポイント付与"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible>
                        {roomPerformers[room.id]?.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            パフォーマーがいません
                          </div>
                        ) : (
                          roomPerformers[room.id]?.map((performer) => (
                            <AccordionItem
                              value={performer.id}
                              key={performer.id}
                            >
                              <AccordionTrigger
                                onClick={() =>
                                  handlePerformerClick(performer.id)
                                }
                              >
                                <div className="flex items-center justify-between w-full mr-4">
                                  <span>
                                    {performer.name || performer.email}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {performerHistories[performer.id]
                                      ? `${calculateTotalPoints(
                                          performerHistories[performer.id]
                                        )} ポイント`
                                      : "履歴を表示"}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                {loadingPerformer === performer.id ? (
                                  <div className="text-center py-4">
                                    読み込み中...
                                  </div>
                                ) : performerHistories[performer.id] &&
                                  performerHistories[performer.id].length >
                                    0 ? (
                                  <div className="space-y-2">
                                    {performerHistories[performer.id]
                                      .slice(0, 10)
                                      .map((history) => (
                                        <div
                                          key={history.id}
                                          className="flex items-center justify-between p-2 bg-muted rounded"
                                        >
                                          <div>
                                            <p className="text-sm font-medium">
                                              {formatPointType(history.type)}
                                            </p>
                                            {history.reason && (
                                              <p className="text-xs text-muted-foreground">
                                                {history.reason}
                                              </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                              {new Date(
                                                history.createdAt
                                              ).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <div className="text-sm font-bold">
                                            +{history.points}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground">
                                    ポイント履歴がありません
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          ))
                        )}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-muted-foreground">
                    プランナーとして管理しているルームがありません
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PointsPage;
