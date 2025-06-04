// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   PLAN_LIMITS,
//   getPlanDescription,
//   getPlanName,
// } from "@/lib/subscription-limits";
// import { PlanType } from "@prisma/client";
// import { Calendar, Check, Crown, Users, Video } from "lucide-react";

// const plans: Array<{
//   type: PlanType;
//   popular?: boolean;
//   features: string[];
// }> = [
//   {
//     type: "FREE",
//     features: [
//       "録画機能 1日1回",
//       "保存期間 1日",
//       "参加者 2人まで",
//       "基本的なタスク管理",
//     ],
//   },
//   {
//     type: "BASIC",
//     popular: true,
//     features: [
//       "録画機能 1日3件",
//       "保存期間 1ヶ月",
//       "参加者 2人まで",
//       "高度なタスク管理",
//       "メール通知",
//     ],
//   },
//   {
//     type: "PRO",
//     features: [
//       "録画機能 1日6件",
//       "保存期間 3ヶ月",
//       "参加者 5人まで",
//       "すべての機能",
//       "優先サポート",
//       "データエクスポート",
//     ],
//   },
// ];

// export default async function PricingPage() {
//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="text-center mb-8">
//         <h1 className="text-3xl font-bold mb-2">料金プラン</h1>
//         <p className="text-muted-foreground">
//           あなたのチームに最適なプランを選択してください
//         </p>
//       </div>

//       <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
//         {plans.map((plan) => {
//           const limits = PLAN_LIMITS[plan.type];
//           const isPopular = plan.popular;

//           return (
//             <Card
//               key={plan.type}
//               className={`relative ${
//                 isPopular ? "border-primary shadow-lg scale-105" : ""
//               }`}
//             >
//               {isPopular && (
//                 <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
//                   <Crown className="w-3 h-3 mr-1" />
//                   人気
//                 </Badge>
//               )}

//               <CardHeader className="text-center">
//                 <CardTitle className="text-2xl">
//                   {getPlanName(plan.type)}
//                 </CardTitle>
//                 <CardDescription>
//                   {getPlanDescription(plan.type)}
//                 </CardDescription>
//                 <div className="mt-4">
//                   {plan.type === "FREE" ? (
//                     <div className="text-3xl font-bold">無料</div>
//                   ) : (
//                     <div>
//                       <span className="text-3xl font-bold">
//                         ¥{limits.price}
//                       </span>
//                       <span className="text-muted-foreground">/月</span>
//                     </div>
//                   )}
//                 </div>
//               </CardHeader>

//               <CardContent className="space-y-4">
//                 <div className="grid gap-2 text-sm">
//                   <div className="flex items-center gap-2">
//                     <Video className="h-4 w-4 text-muted-foreground" />
//                     <span>録画 {limits.maxDailyRecordings}件/日</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Users className="h-4 w-4 text-muted-foreground" />
//                     <span>参加者 {limits.maxParticipants}人まで</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Calendar className="h-4 w-4 text-muted-foreground" />
//                     <span>保存期間 {limits.recordingRetentionDays}日</span>
//                   </div>
//                 </div>

//                 <div className="border-t pt-4">
//                   <ul className="space-y-2">
//                     {plan.features.map((feature, index) => (
//                       <li
//                         key={index}
//                         className="flex items-center gap-2 text-sm"
//                       >
//                         <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
//                         <span>{feature}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </CardContent>

//               <CardFooter>
//                 <Button
//                   className="w-full"
//                   variant={isPopular ? "default" : "outline"}
//                   disabled={plan.type === "FREE"}
//                 >
//                   {plan.type === "FREE"
//                     ? "現在のプラン"
//                     : `${getPlanName(plan.type)}を選択`}
//                 </Button>
//               </CardFooter>
//             </Card>
//           );
//         })}
//       </div>

//       <div className="text-center mt-8 text-sm text-muted-foreground">
//         <p>すべてのプランに30日間の無料トライアルが含まれています</p>
//         <p>いつでもキャンセル可能です</p>
//       </div>
//     </div>
//   );
// }
import { PricingTable } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1rem" }}>
      <PricingTable
        // localization={{ en: customLocalization }}

        appearance={{
          elements: {
            commerce: {
              billedMonthlyOnly: "Billed annuallyyyy",
            },
          },
          variables: {
            colorPrimary: "#4F46E5", // Tailwind Indigo 600
            colorText: "#111827", // Tailwind Gray 900
            colorBackground: "#FFFFFF", // Tailwind White
          },
        }}
      />
    </div>
  );
}
