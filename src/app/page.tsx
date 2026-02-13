import { StaticStatsCounter } from "@/components/StaticStatsCounter";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/db";
import { PublicStats } from "@/types";
import {
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  Clock,
  LayoutDashboard,
  Star,
  Users,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 30;

async function getPublicStats(): Promise<PublicStats> {
  try {
    console.log("[SSR] 統計データを取得中...");
    const [totalCompletedPomodoros, totalRooms, totalUsers] = await Promise.all(
      [
        prisma.session.count({
          where: {
            completed: true,
          },
        }),
        prisma.room.count(),
        prisma.user.count(),
      ],
    );

    const stats = {
      totalCompletedPomodoros,
      totalRooms,
      totalUsers,
    };

    console.log("[SSR] 統計データ取得完了:", stats);
    return stats;
  } catch (error) {
    console.error("[SSR] 統計データの取得に失敗:", error);
    return {
      totalCompletedPomodoros: 0,
      totalRooms: 0,
      totalUsers: 0,
    };
  }
}

export default async function LandingPage() {
  const stats = await getPublicStats();
  const previewTasks = [
    { title: "数学演習まとめ", status: "進行中", pomos: "2 / 4" },
    { title: "企画レビュー", status: "Todo", pomos: "0 / 3" },
    { title: "録画アップロード", status: "完了", pomos: "1 / 1" },
  ];
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <Image
              src="/icon_trimmed.png"
              alt="PomoLink"
              width={40}
              height={40}
              className="transition-transform"
            />
            <Image
              src="/pomolink_text_trimmed.png"
              alt="PomoLink"
              width={140}
              height={40}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            />
          </div>
          <div className="ml-auto flex space-x-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600  px-5 py-2 text-sm font-medium text-white shadow-sm hover:shadow-lg transition-all hover-lift"
            >
              ログイン
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-5 py-2 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50 transition-all hover-lift"
            >
              新規登録
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="space-y-8">
                <div className="space-y-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    TEAM FOCUSED PRODUCTIVITY
                  </p>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-slate-900">
                    チームの集中習慣を
                    <span className="block text-indigo-600">
                      設計して、記録して、共有する
                    </span>
                  </h1>
                  <p className="text-lg text-slate-600 md:text-xl leading-relaxed">
                    PomoLinkは招待制ルームでポモドーロとタスクをまとめ、録画つきタイマーやポイント配布、
                    ダッシュボードでの振り返りまで一体化したチーム向けプロダクティビティ体験を提供します。
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link
                      href="/sign-up"
                      className="group inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-indigo-700 transition-all"
                    >
                      今すぐはじめる
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="#features"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-4 text-lg font-medium text-slate-800 hover:bg-slate-50 transition-all"
                    >
                      機能を見る
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 pt-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">今日の記録</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                      4/6 ポモドーロ
                    </p>
                    <p className="text-sm text-slate-500">
                      朝会ルームで 3 人が集中しています
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">最新のポイント</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                      +35 pt
                    </p>
                    <p className="text-sm text-slate-500">
                      プランナーからレビュー達成に付与
                    </p>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-8">
                  <StaticStatsCounter initialStats={stats} />
                </div>
              </div>

              <div className="relative w-full">
                <div className="absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-br from-indigo-100 to-purple-100 blur-3xl" />
                <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-2xl shadow-indigo-100/70 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase text-slate-400 tracking-[0.3em]">
                        ROOM
                      </p>
                      <p className="text-xl font-semibold text-slate-900">
                        夜ふかしラボ
                      </p>
                      <p className="text-sm text-slate-500">
                        今日 4/6 ポモドーロ
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      集中タイム
                    </Badge>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm text-slate-500">
                          進行中のセッション
                        </p>
                        <p className="text-4xl font-bold text-slate-900">
                          17:32
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">休憩まで</p>
                        <p className="text-lg font-semibold text-slate-900">
                          07:28
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white">
                      <div className="h-full w-3/4 rounded-full bg-indigo-500" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>25分 / 5分</span>
                      <span>録画オン</span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">
                        TASKS
                      </p>
                      <div className="space-y-3">
                        {previewTasks.map((task) => (
                          <div
                            key={task.title}
                            className="flex items-start justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {task.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                {task.status}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-slate-500">
                              {task.pomos}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">
                        MEMBERS
                      </p>
                      <div className="space-y-3">
                        {[
                          {
                            name: "Rina",
                            role: "Planner",
                            status: "タイマー管理中",
                          },
                          {
                            name: "Kaito",
                            role: "Performer",
                            status: "+10 pt 付与",
                          },
                          {
                            name: "Sora",
                            role: "Performer",
                            status: "録画アップ中",
                          },
                        ].map((member) => (
                          <div
                            key={member.name}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {member.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {member.status}
                              </p>
                            </div>
                            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                              {member.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                現場のチーム運用に必要なものを一つに
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                ルーム管理からタスク、録画、ポイントまで同じワークスペースで完結します
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: "招待制ルーム",
                  description:
                    "プランナーがルームを作成し、メンバーを招待。タスクやポイント運用を役割ごとに整理できます",
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  icon: ClipboardCheck,
                  title: "タスクとワークフロー",
                  description:
                    "ルーム内でタスクを作成し、優先度やステータスを更新。進行状況を全員で共有できます",
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  icon: Video,
                  title: "録画つきタイマー",
                  description:
                    "カメラ録画をオンにしたポモドーロセッションを保存し、必要に応じて動画で振り返れます",
                  gradient: "from-yellow-500 to-orange-500",
                },
                {
                  icon: LayoutDashboard,
                  title: "進捗ダッシュボード",
                  description:
                    "ポモドーロ数・完了タスク・アクティビティをダッシュボードで確認し、チームの歩みを把握できます",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  icon: Clock,
                  title: "柔軟なタイマー設定",
                  description:
                    "タスクごとに作業/休憩の長さを変更し、チームのワークスタイルに合わせた集中サイクルを作れます",
                  gradient: "from-indigo-500 to-blue-500",
                },
                {
                  icon: Star,
                  title: "ポイント運用",
                  description:
                    "プランナーがメンバーへポイントを付与し、履歴でモチベーションを共有できます",
                  gradient: "from-red-500 to-pink-500",
                },
              ].map((feature, index) => (
                <div key={index} className="group relative">
                  <div className="h-full p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all hover-lift">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4`}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-stone-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-12 shadow-xl shadow-indigo-100/50">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div className="text-left">
                  <p className="text-sm font-semibold tracking-[0.3em] text-slate-500">
                    NEXT ACTION
                  </p>
                  <h2 className="mt-4 text-3xl font-bold text-slate-900 leading-tight">
                    今日のルームをつくって、
                    <br className="hidden lg:block" />
                    集中の流れを整えましょう
                  </h2>
                  <p className="mt-4 text-lg text-slate-600">
                    無料プランから始めて、タスク・ポイント・録画のワークフローをそのまま体験できます。
                    チームの週次リズムに合わせていつでもアップグレード可能です。
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      "招待制ルームで参加者を管理",
                      "録画オン/オフを切り替えながらポモドーロ実行",
                      "ダッシュボードとポイントで振り返り",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-slate-700"
                      >
                        <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">次のセッション</p>
                      <p className="text-2xl font-semibold text-slate-900">
                        20:30 スタート
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                      ルーム: 夜ふかしラボ
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Planner</span>
                      <span className="font-semibold text-slate-900">Rina</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Performer</span>
                      <span className="font-semibold text-slate-900">
                        Kaito, Sora
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>録画設定</span>
                      <span className="font-semibold text-emerald-600">
                        オン
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-indigo-700 transition-all"
                  >
                    今すぐはじめる
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <p className="text-center text-sm text-slate-500">
                    クレジットカード不要・いつでもキャンセル可能
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} PomoLink. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
