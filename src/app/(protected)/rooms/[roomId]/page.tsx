"use client";
import { useParams } from "next/navigation";

export default function RoomPage() {
  const { roomId } = useParams();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ルーム詳細</h1>
      <span>Room ID: {roomId}</span>
      <p>ルームの詳細を表示します。</p>
      {/* ルームの詳細 */}
    </div>
  );
}
