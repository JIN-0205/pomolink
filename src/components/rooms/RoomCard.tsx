import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Room } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Users } from "lucide-react";
import Link from "next/link";

interface RoomCardProps {
  room: Room;
  participantCount?: number;
  role?: "PLANNER" | "PERFORMER";
}

export function RoomCard({ room, participantCount = 0, role }: RoomCardProps) {
  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="h-full overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{room.name}</CardTitle>
            {role && (
              <Badge variant={role === "PLANNER" ? "main" : "outline"}>
                {role === "PLANNER" ? "プランナー" : "パフォーマー"}
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {room.description || "説明はありません"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-1 h-4 w-4" />
            <span>{participantCount}人が参加中</span>
          </div>
        </CardContent>
        <CardFooter className="pt-2 text-xs text-muted-foreground">
          作成日:{" "}
          {format(new Date(room.createdAt), "yyyy年MM月dd日", { locale: ja })}
        </CardFooter>
      </Card>
    </Link>
  );
}
