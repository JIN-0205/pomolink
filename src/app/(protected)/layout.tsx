"use client";

import { cn } from "@/lib/utils";
import { SignOutButton, useAuth, UserButton } from "@clerk/nextjs";
import {
  Clock,
  Coins,
  Home,
  ListTodo,
  LogOut,
  Menu,
  Receipt,
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
      href: "/pricing",
      label: "サブスクリプション",
      icon: Receipt,
      active: pathname?.startsWith("/pricing"),
    },
    {
      href: "/profile",
      label: "プロフィール",
      icon: User,
      active: pathname?.startsWith("/profile"),
    },
    {
      href: "/settings",
      label: "設定",
      icon: Settings,
      active: pathname?.startsWith("/settings"),
    },
  ];

  if (!isLoaded || !isSignedIn || !userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center p-8 rounded-2xl bg-white shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            サインインしてください
          </h1>
          <p className="mt-4 text-gray-500">
            サインインして、PomoLinkの機能を利用してください。
          </p>
          <button
            onClick={() => router.push("/sign-in")}
            className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all hover-lift"
          >
            サインイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed z-50 bottom-6 right-6 bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover-lift"
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Menu size={24} className="text-white" />
        )}
      </button>

      <div className="hidden lg:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <div className="h-full border-r bg-white shadow-sm flex flex-col">
          <Link
            href="/dashboard"
            className="p-6 flex items-center justify-center relative min-h-20 cursor-pointer group hover:scale-110  transition-transform"
          >
            <Image
              src="/icon_trimmed.png"
              alt="PomoLink"
              width={40}
              height={40}
              className="absolute left-6  transition-transform"
            />
            <Image
              src="/pomolink_text_trimmed.png"
              alt="PomoLink"
              width={140}
              height={40}
              className="absolute top-9 left-18  transition-transform"
            />
          </Link>

          <div className="flex-1 flex flex-col justify-between py-4">
            <nav className="flex-1 px-4 space-y-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl py-3 px-4 text-sm font-medium transition-all hover-lift",
                    route.active
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  )}
                >
                  <route.icon
                    className={cn(
                      "h-5 w-5",
                      route.active ? "text-white" : "text-gray-500"
                    )}
                  />
                  {route.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 hover:scale-130 transition-transform",
                  },
                }}
              />
              <SignOutButton>
                <button className="flex items-center text-sm text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all hover-lift">
                  <LogOut className="h-4 w-4 mr-2" />
                  サインアウト
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl transform transition-transform",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full flex flex-col">
            <div className="p-6  bg-gradient-to-r from-indigo-500 to-purple-500">
              <Image
                src="/icon_trimmed.png"
                alt="PomoLink"
                width={40}
                height={40}
                className="brightness-0 invert"
              />
              <Image
                src="/pomolink_text_trimmed.png"
                alt="PomoLink"
                width={140}
                height={40}
                className="brightness-0 invert absolute top-9 left-18  transition-transform"
              />
            </div>

            <div className="flex-1 flex flex-col justify-between py-4">
              <nav className="flex-1 px-4 space-y-2">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl py-3 px-4 text-sm font-medium transition-all",
                      route.active
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                        : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                    )}
                  >
                    <route.icon
                      className={cn(
                        "h-5 w-5",
                        route.active ? "text-white" : "text-gray-500"
                      )}
                    />
                    {route.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <UserButton afterSignOutUrl="/" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/sign-out");
                  }}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  サインアウト
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="lg:pl-72 min-h-screen">
        <div className="h-full p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
