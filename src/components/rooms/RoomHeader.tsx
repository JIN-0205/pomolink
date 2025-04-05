// // src/components/rooms/RoomHeader.tsx
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { RoomWithParticipants } from "@/types";
// import { format } from "date-fns";
// import { ja } from "date-fns/locale";
// import { Settings, UserGroup } from "lucide-react";
// import { InviteButton } from "./InviteButton";
// import { ShareRoomButton } from "./ShareRoomButton";

// interface RoomHeaderProps {
//   room: RoomWithParticipants;
// }

// export function RoomHeader({ room }: RoomHeaderProps) {
//   const isPlannerOrCreator = room.participants.some(
//     (p) => p.userId === room.creatorId || p.role === "PLANNER"
//   );

//   const participantCount = room.participants.length;

//   return (
//     <div className="mb-6 space-y-4">
//       <div className="flex items-center justify-between">
//         <div>
//           <div className="flex items-center gap-2">
//             <h1 className="text-3xl font-bold">{room.name}</h1>
//             {room.isPrivate ? (
//               <Badge variant="secondary">非公開</Badge>
//             ) : (
//               <Badge variant="outline">公開</Badge>
//             )}
//           </div>
//           <p className="mt-1 text-sm text-muted-foreground">
//             作成日:{" "}
//             {format(new Date(room.createdAt), "yyyy年MM月dd日", { locale: ja })}
//             {" • "}
//             <span className="inline-flex items-center">
//               <UserGroup className="mr-1 h-3 w-3" />
//               {participantCount}人が参加中
//             </span>
//           </p>
//         </div>

//         <div className="flex gap-2">
//           <InviteButton roomId={room.id} disabled={!isPlannerOrCreator} />
//           <ShareRoomButton roomId={room.id} inviteCode={room.inviteCode} />
//           {isPlannerOrCreator && (
//             <Button variant="outline" size="sm">
//               <Settings className="mr-2 h-4 w-4" />
//               設定
//             </Button>
//           )}
//         </div>
//       </div>

//       {room.description && (
//         <p className="text-sm leading-relaxed">{room.description}</p>
//       )}
//     </div>
//   );
// }
