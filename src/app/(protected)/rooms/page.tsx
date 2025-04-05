import { RoomList } from "@/components/rooms/RoomList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ルーム一覧 | PomoShare",
  description: "参加中のルーム一覧",
};

export default function RoomsPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">ルーム</h1>
      <RoomList />
    </div>
  );
}
