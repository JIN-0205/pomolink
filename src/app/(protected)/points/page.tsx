"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Room, User } from "@/types";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

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

// ポイント履歴取得API
const fetchSelfPointHistories = async (): Promise<PointHistory[]> => {
  const res = await fetch("/api/points/self");
  if (!res.ok) return [];
  const data = (await res.json()) as ApiHistoriesResponse;
  return data.histories;
};

// ルーム一覧取得API
const fetchPlannerRooms = async (): Promise<Room[]> => {
  const res = await fetch("/api/rooms?role=PLANNER");
  if (!res.ok) return [];
  const data = (await res.json()) as ApiRoomItem[];
  return data.map((item) => item.room);
};

// ルーム一覧取得API (パフォーマーとして所属)
const fetchSelfRooms = async (): Promise<Room[]> => {
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
  const [histories, setHistories] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // パフォーマー管理用
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomPerformers, setRoomPerformers] = useState<Record<string, User[]>>(
    {}
  );
  const [, setExpandedPerformer] = useState<{
    [userId: string]: boolean;
  }>({});
  // const [expandedPerformer, setExpandedPerformer] = useState<{
  //   [userId: string]: boolean;
  // }>({});
  const [performerHistories, setPerformerHistories] = useState<{
    [userId: string]: PointHistory[];
  }>({});
  const [loadingPerformer, setLoadingPerformer] = useState<string | null>(null);

  // 自分が所属するルーム (パフォーマー)
  const [selfRooms, setSelfRooms] = useState<Room[]>([]);
  // ルームごとの自分の履歴
  const [selfRoomHistories, setSelfRoomHistories] = useState<
    Record<string, PointHistory[]>
  >({});
  const [loadingSelfRoom, setLoadingSelfRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    setLoading(true);
    fetchSelfPointHistories().then((h) => {
      setHistories(h);
      setLoading(false);
    });
    // ルーム一覧取得
    fetchPlannerRooms().then((rooms) => {
      setRooms(rooms);
      // Plannerとして所属するルームごとの履歴取得
      rooms.forEach((room) => {
        setLoadingSelfRoom(room.id);
        fetchSelfHistoriesByRoom(room.id).then((h) => {
          setSelfRoomHistories((prev) => ({ ...prev, [room.id]: h }));
          setLoadingSelfRoom(null);
        });
      });
      // 既存のパフォーマー管理用ルームPerformers
      rooms.forEach((room) => {
        fetchRoomPerformers(room.id).then((performers) => {
          setRoomPerformers((prev) => ({ ...prev, [room.id]: performers }));
        });
      });
    });
    // Performerとして所属するルーム
    fetchSelfRooms().then((rooms) => {
      setSelfRooms(rooms);
      rooms.forEach((room) => {
        setLoadingSelfRoom(room.id);
        fetchSelfHistoriesByRoom(room.id).then((h) => {
          setSelfRoomHistories((prev) => ({ ...prev, [room.id]: h }));
          setLoadingSelfRoom(null);
        });
      });
    });
  }, [isLoaded]);

  // パフォーマー名クリック時に履歴取得
  const handlePerformerClick = async (userId: string) => {
    setExpandedPerformer((prev) => ({ ...prev, [userId]: !prev[userId] }));
    if (!performerHistories[userId]) {
      setLoadingPerformer(userId);
      const histories = await fetchUserPointHistories(userId);
      setPerformerHistories((prev) => ({ ...prev, [userId]: histories }));
      setLoadingPerformer(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">ポイント管理</h1>
      <Tabs defaultValue="self" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="self">自分のポイント</TabsTrigger>
          <TabsTrigger value="performers">パフォーマー管理</TabsTrigger>
        </TabsList>
        <TabsContent value="self">
          <section>
            <h2 className="text-xl font-semibold mb-2">自分のポイント</h2>
            {/* PerformerかPlannerか判定 */}
            {selfRooms.length > 0 ? (
              <div className="space-y-6">
                {selfRooms.map((room) => (
                  <Card key={room.id}>
                    <CardHeader>
                      <CardTitle>{room.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingSelfRoom === room.id ? (
                        <div>読み込み中...</div>
                      ) : (
                        <ul className="space-y-2">
                          {selfRoomHistories[room.id]?.length === 0 ? (
                            <li className="text-muted-foreground">
                              ポイント履歴がありません
                            </li>
                          ) : (
                            selfRoomHistories[room.id].map((h) => (
                              <li
                                key={h.id}
                                className="border rounded px-3 py-2"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{h.type}</span>
                                  <span className="text-lg font-bold">
                                    +{h.points}
                                  </span>
                                </div>
                                {h.reason && (
                                  <div className="text-sm text-muted-foreground">
                                    {h.reason}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">
                                  {new Date(h.createdAt).toLocaleString()}
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : rooms.length > 0 ? (
              <div className="space-y-6">
                {rooms.map((room) => (
                  <Card key={room.id}>
                    <CardHeader>
                      <CardTitle>{room.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingSelfRoom === room.id ? (
                        <div>読み込み中...</div>
                      ) : (
                        <ul className="space-y-2">
                          {selfRoomHistories[room.id]?.length === 0 ? (
                            <li className="text-muted-foreground">
                              ポイント履歴がありません
                            </li>
                          ) : (
                            selfRoomHistories[room.id].map((h) => (
                              <li
                                key={h.id}
                                className="border rounded px-3 py-2"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{h.type}</span>
                                  <span className="text-lg font-bold">
                                    +{h.points}
                                  </span>
                                </div>
                                {h.reason && (
                                  <div className="text-sm text-muted-foreground">
                                    {h.reason}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">
                                  {new Date(h.createdAt).toLocaleString()}
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : loading ? (
              <div>読み込み中...</div>
            ) : histories.length === 0 ? (
              <div className="text-muted-foreground">
                ポイント履歴がありません
              </div>
            ) : (
              <ul className="space-y-2">
                {histories.map((h) => (
                  <li key={h.id} className="border rounded px-3 py-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{h.type}</span>
                      <span className="text-lg font-bold">+{h.points}</span>
                    </div>
                    {h.reason && (
                      <div className="text-sm text-muted-foreground">
                        {h.reason}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      {new Date(h.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
        <TabsContent value="performers">
          <section>
            <h2 className="text-xl font-semibold mb-4">パフォーマー管理</h2>
            <div className="space-y-6">
              {rooms.map((room) => (
                <Card key={room.id}>
                  <CardHeader>
                    <CardTitle>{room.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      {roomPerformers[room.id]?.length === 0 && (
                        <div className="text-muted-foreground">
                          パフォーマーがいません
                        </div>
                      )}
                      {roomPerformers[room.id]?.map((performer) => (
                        <AccordionItem value={performer.id} key={performer.id}>
                          <AccordionTrigger
                            onClick={() => handlePerformerClick(performer.id)}
                          >
                            {performer.name || performer.email || performer.id}
                          </AccordionTrigger>
                          <AccordionContent>
                            {loadingPerformer === performer.id ? (
                              <div>読み込み中...</div>
                            ) : performerHistories[performer.id] ? (
                              <ul className="space-y-2">
                                {performerHistories[performer.id].length ===
                                0 ? (
                                  <li className="text-muted-foreground">
                                    ポイント履歴がありません
                                  </li>
                                ) : (
                                  performerHistories[performer.id].map((h) => (
                                    <li
                                      key={h.id}
                                      className="border rounded px-3 py-2"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">
                                          {h.type}
                                        </span>
                                        <span className="text-lg font-bold">
                                          +{h.points}
                                        </span>
                                      </div>
                                      {h.reason && (
                                        <div className="text-sm text-muted-foreground">
                                          {h.reason}
                                        </div>
                                      )}
                                      <div className="text-xs text-gray-400">
                                        {new Date(h.createdAt).toLocaleString()}
                                      </div>
                                    </li>
                                  ))
                                )}
                              </ul>
                            ) : null}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PointsPage;
