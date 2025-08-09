"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RoomSettingsFormProps {
  roomId: string;
}

export default function RoomSettingsForm({ roomId }: RoomSettingsFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const roomData = await res.json();
          setName(roomData.name);
          setDescription(roomData.description || "");
        } else {
          toast("エラー", { description: "ルーム情報の取得に失敗しました" });
        }
      } catch (e) {
        console.error("Error fetching room details:", e);
        toast("エラー", { description: "ルーム情報の取得に失敗しました" });
      }
    };
    fetchRoomDetails();
  }, [roomId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        toast("ルーム情報を更新しました");
        router.push(`/rooms/${roomId}`); // ルーム詳細ページにリダイレクト
      } else {
        toast("エラー", { description: "ルーム情報の更新に失敗しました" });
      }
    } catch (e) {
      console.error("Error updating room settings:", e);
      toast("エラー", { description: "ルーム情報の更新に失敗しました" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="space-y-6"
    >
      <div>
        <label className="block font-medium mb-1">ルーム名</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={50}
        />
      </div>
      <div>
        <label className="block font-medium mb-1">説明</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "保存中..." : "保存"}
      </Button>
    </form>
  );
}
