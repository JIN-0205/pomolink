// // src/components/rooms/RoomTabs.tsx
// "use client";

// import { ParticipantList } from "@/components/rooms/ParticipantList";
// import { RoomOverview } from "@/components/rooms/RoomOverview";
// import { TaskBoard } from "@/components/tasks/TaskBoard";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { usePathname, useRouter } from "next/navigation";

// interface RoomTabsProps {
//   roomId: string;
// }

// export function RoomTabs({ roomId }: RoomTabsProps) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const isRootPath = pathname === `/rooms/${roomId}`;

//   // 現在のタブを判断
//   let currentTab = "overview";
//   if (pathname.includes("/tasks")) {
//     currentTab = "tasks";
//   } else if (pathname.includes("/participants")) {
//     currentTab = "participants";
//   }

//   // タブ変更時の処理
//   const handleTabChange = (value: string) => {
//     switch (value) {
//       case "overview":
//         router.push(`/rooms/${roomId}`);
//         break;
//       case "tasks":
//         router.push(`/rooms/${roomId}/tasks`);
//         break;
//       case "participants":
//         router.push(`/rooms/${roomId}/participants`);
//         break;
//     }
//   };

//   // ルートパスの場合のみタブを表示する
//   if (isRootPath) {
//     return (
//       <Tabs
//         defaultValue="overview"
//         value={currentTab}
//         onValueChange={handleTabChange}
//       >
//         <TabsList className="mb-6">
//           <TabsTrigger value="overview">概要</TabsTrigger>
//           <TabsTrigger value="tasks">タスク</TabsTrigger>
//           <TabsTrigger value="participants">参加者</TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview">
//           <RoomOverview roomId={roomId} />
//         </TabsContent>

//         <TabsContent value="tasks">
//           <TaskBoard roomId={roomId} />
//         </TabsContent>

//         <TabsContent value="participants">
//           <ParticipantList roomId={roomId} />
//         </TabsContent>
//       </Tabs>
//     );
//   }

//   // 下位ページの場合はタブを表示せず、コンテンツのみ表示
//   return null;
// }
