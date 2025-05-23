import { CreateRoomForm } from "@/components/rooms/CreateRoomForm";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ルーム作成 | PomoLink",
  description: "新しいルームを作成",
};

export default function CreateRoomPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー部分 */}
        <div className="mb-8">
          <Link
            href="/rooms"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ルーム一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            新しいルームを作成
          </h1>
          <p className="mt-2 text-gray-600">
            チームメンバーと一緒にポモドーロセッションを行うためのルームを作成します。
          </p>
        </div>

        {/* フォーム部分 */}
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <CreateRoomForm />
          </div>
        </div>
      </div>
    </div>
  );
}
