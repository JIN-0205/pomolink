import RoomSettingsForm from "@/components/rooms/RoomSettingsForm";

interface SettingsPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomSettingsPage({ params }: SettingsPageProps) {
  const { roomId } = await params;

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">ルーム設定</h1>
      <RoomSettingsForm roomId={roomId} />
    </main>
  );
}
