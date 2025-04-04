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
import Link from "next/link";
import { redirect } from "next/navigation";

export default function LandingPage() {
  // ログイン済みの場合はダッシュボードにリダイレクト
  const { isSignedIn } = useUser();
  if (isSignedIn) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* ナビゲーションバー */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">PomoShare</h1>
          <div className="ml-auto flex space-x-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              ログイン
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-md border border-primary bg-transparent px-5 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary/10"
            >
              新規登録
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <main className="flex-1">
        <section className="bg-gradient-to-b from-background to-muted py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                集中力を共有し、
                <br />
                成長を加速させる
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                PomoShareは共有できるポモドーロタイマーで、学習やタスク管理をより効率的に、
                そして楽しくサポートします。
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  無料ではじめる
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  機能を見る
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 機能セクション */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              主な機能
            </h2>
            {/* 機能リスト */}
            {/* ... */}
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t border-border bg-background py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PomoShare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
