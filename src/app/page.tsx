// import prisma from "@/lib/db";

// export default async function Home() {
//   const users = await prisma.user.findMany();
//   return (
//     <div className="min-h-full">
//       <h1>Welcome to the Home Page</h1>
//       <p>This is a simple example of a Next.js application.</p>
//       <p>Enjoy your stay!</p>
//       <div>{JSON.stringify(users)}</div>
//     </div>
//   );
// }
"use client";

import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Star,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function LandingPage() {
  // ログイン済みの場合はダッシュボードにリダイレクト
  const { isSignedIn } = useUser();
  if (isSignedIn) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* ナビゲーションバー */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              PomoLink
            </h1>
          </div>
          <div className="ml-auto flex space-x-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:shadow-lg transition-all hover-lift"
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

      {/* ヒーローセクション */}
      <main className="flex-1">
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* 背景装飾 */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-8 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              {/* バッジ */}
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-indigo-200 mb-8">
                <Star className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  共同作業で集中力を最大化
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
                <span className="block">集中力を</span>
                <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  共有し、成長を加速
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 md:text-xl max-w-3xl mx-auto leading-relaxed">
                PomoLinkは共有できるポモドーロタイマーで、チームでの学習やタスク管理をより効率的に、
                そして楽しくサポートします。一緒に集中し、一緒に成長しましょう。
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4 text-lg font-medium text-white shadow-lg hover:shadow-xl transition-all hover-lift"
                >
                  無料ではじめる
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-4 text-lg font-medium text-gray-700 hover:bg-gray-50 transition-all hover-lift"
                >
                  機能を見る
                </Link>
              </div>

              {/* 統計情報 */}
              <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    1000+
                  </div>
                  <div className="text-sm text-gray-500">
                    アクティブユーザー
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">50k+</div>
                  <div className="text-sm text-gray-500">完了ポモドーロ</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">200+</div>
                  <div className="text-sm text-gray-500">アクティブルーム</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 機能セクション */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                なぜPomoLinkなのか？
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                従来のポモドーロタイマーの枠を超えた、チーム協働型の集中管理ツール
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: "チーム同期",
                  description:
                    "仲間と一緒にポモドーロを実行し、お互いのモチベーションを高め合います",
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  icon: Target,
                  title: "タスク管理",
                  description:
                    "ポモドーロと連携したタスク管理で、効率的に目標を達成できます",
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  icon: Zap,
                  title: "リアルタイム",
                  description:
                    "チームメンバーの集中状況をリアルタイムで共有し、同期を保ちます",
                  gradient: "from-yellow-500 to-orange-500",
                },
                {
                  icon: CheckCircle,
                  title: "進捗追跡",
                  description:
                    "詳細な統計とレポートで、個人とチームの成長を可視化します",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  icon: Clock,
                  title: "柔軟な設定",
                  description:
                    "チームに合わせてポモドーロの時間や休憩時間をカスタマイズできます",
                  gradient: "from-indigo-500 to-blue-500",
                },
                {
                  icon: Star,
                  title: "ポイント制",
                  description:
                    "ゲーミフィケーション要素でモチベーションを維持し、継続しやすくします",
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

        {/* CTA セクション */}
        <section className="py-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              今すぐチームの生産性を向上させませんか？
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              無料でアカウントを作成し、チームメンバーと一緒に集中力を高めましょう
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-medium text-indigo-600 shadow-lg hover:shadow-xl transition-all hover-lift hover:scale-105"
            >
              無料で始める
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* フッター */}
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
