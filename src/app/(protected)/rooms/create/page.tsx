import { CreateRoomForm } from "@/components/rooms/CreateRoomForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ルーム作成 | PomoShare",
  description: "新しいルームを作成",
};

export default function CreateRoomPage() {
  return (
    <div className="container max-w-2xl py-6">
      <h1 className="mb-6 text-3xl font-bold">ルーム作成</h1>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <CreateRoomForm />
      </div>
    </div>
  );
}
