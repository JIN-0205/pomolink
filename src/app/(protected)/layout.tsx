"use client";

import logoIcon from "@/assets/pomolink_icon.svg";
import logoText from "@/assets/pomolink_text.svg";
import { cn } from "@/lib/utils";
import { SignOutButton, useAuth, UserButton } from "@clerk/nextjs";
import {
  Clock,
  Coins,
  Home,
  ListTodo,
  LogOut,
  Menu,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, userId } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const routes = [
    {
      href: "/dashboard",
      label: "ダッシュボード",
      icon: Home,
      active: pathname === "/dashboard",
    },
    {
      href: "/rooms",
      label: "ルーム",
      icon: Users,
      active: pathname?.startsWith("/rooms"),
    },
    {
      href: "/points",
      label: "ポイント管理",
      icon: Coins,
      active: pathname?.startsWith("/points"),
    },
    {
      href: "/tasks",
      label: "タスク",
      icon: ListTodo,
      active: pathname?.startsWith("/tasks"),
    },
    {
      href: "/media-test/webCodecs",
      label: "WebCodecs",
      icon: Clock,
      active: pathname?.startsWith("/media-test"),
    },
    {
      href: "/media-test/ImageAnalyzer",
      label: "Image Analyzer",
      icon: Clock,
      active: pathname?.startsWith("/media-test/ImageAnalyzer"),
    },
  ];
  if (!isLoaded || !isSignedIn || !userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">サインインしてください</h1>
          <p className="mt-4 text-gray-500">
            サインインして、アプリの機能を利用してください。
          </p>
          <button
            onClick={() => router.push("/sign-in")}
            className="mt-6 bg-primary text-white px-4 py-2 rounded-md"
          >
            サインイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* モバイルサイドバートグル */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed z-40 bottom-4 right-4 bg-primary p-3 rounded-full shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* サイドバー - デスクトップ */}
      <div className="hidden lg:flex h-full w-72 flex-col fixed inset-y-0 z-50 bg-red-500">
        <div className="h-full  border-r flex flex-col bg-white">
          <Link
            href="/"
            className="p-6 flex items-center justify-center relative  min-h-20 cursor-pointer"
          >
            <Image
              src={logoIcon}
              alt="PomoLink"
              width={90}
              height={40}
              className="absolute top-2 left-0 "
            />
            <Image
              src={logoText}
              alt="PomoLink"
              width={160}
              height={40}
              className="absolute top-9 left-14"
            />
          </Link>
          <div className="flex-1 flex flex-col justify-between py-4">
            <nav className="flex-1 px-4 space-y-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium",
                    route.active
                      ? "bg-accent text-accent-foreground "
                      : "hover:bg-accent/50"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  {route.label}
                </Link>
              ))}
            </nav>
            <div className="px-4 space-y-2">
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium hover:bg-accent/50"
              >
                <User className="h-5 w-5" />
                プロフィール
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium hover:bg-accent/50"
              >
                <Settings className="h-5 w-5" />
                設定
              </Link>
            </div>
          </div>
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <UserButton afterSignOutUrl="/" />
              <SignOutButton>
                <div>
                  <LogOut className="h-4 w-4 mr-2" />
                  サインアウト
                </div>
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>

      {/* サイドバー - モバイル */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-opacity ",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 bg-background shadow-lg transform transition-transform",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full flex flex-col bg-[#f9fafb] ">
            <div className="p-6">
              <Image src={logoIcon} alt="PomoLink" width={160} height={40} />
            </div>
            <div className="flex-1 flex flex-col justify-between py-4">
              <nav className="flex-1 px-4 space-y-2 ">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium",
                      route.active
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <route.icon className="h-5 w-5" />
                    {route.label}
                  </Link>
                ))}
              </nav>
              <div className="px-4 space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium hover:bg-accent/50"
                >
                  <User className="h-5 w-5" />
                  プロフィール
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium hover:bg-accent/50"
                >
                  <Settings className="h-5 w-5" />
                  設定
                </Link>
              </div>
            </div>
            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <UserButton afterSignOutUrl="/" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/sign-out");
                  }}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  サインアウト
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="lg:pl-72 min-h-screen">
        <div className="h-full p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
