"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Room } from "@/types";
import { Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RoomCard } from "./RoomCard";

interface RoomItem {
  room: Room;
  participantCount: number;
  completedTaskCount: number;
  role: "PLANNER" | "PERFORMER";
}

export function RoomList() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/rooms");

        if (!res.ok) {
          throw new Error("ルームの取得に失敗しました");
        }

        const data = await res.json();
        // console.log("API response:", data);
        setRooms(data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setError("ルームの取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full py-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-12 text-center ">
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          再試行
        </Button>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-white">
        <EmptyState
          title="ルームがありません"
          description="新しいルームを作成するか、招待コードでルームに参加しましょう"
          action={
            <div className="flex gap-2">
              <Link href="/rooms/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  ルームを作成
                </Button>
              </Link>
              <Link href="/rooms/join">
                <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  ルームに参加
                </Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">参加中のルーム</h2>
        <div className="flex gap-2">
          <Link href="/rooms/join">
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              ルームに参加
            </Button>
          </Link>
          <Link href="/rooms/create">
            <Button variant="main">
              <Plus className="mr-2 h-4 w-4" />
              ルームを作成
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((item) => (
          <RoomCard
            key={item.room.id}
            room={item.room}
            participantCount={item.participantCount}
            completedTasks={item.completedTaskCount}
            role={item.role}
          />
        ))}
      </div>
    </div>
  );
}
