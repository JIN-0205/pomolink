"use client";

import { useClerk } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(true);

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut();
        router.push("/");
      } catch (error) {
        console.error("Sign out error:", error);
        // エラーが発生してもホームページにリダイレクト
        router.push("/");
      } finally {
        setIsSigningOut(false);
      }
    };

    handleSignOut();
  }, [signOut, router]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          サインアウト中...
        </h2>

        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          {isSigningOut
            ? "安全にサインアウトしています。しばらくお待ちください。"
            : "サインアウトが完了しました。ホームページにリダイレクトしています。"}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <p className="text-sm text-blue-800">
            セッションデータを安全にクリアしています...
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          問題が発生した場合は、ブラウザを再読み込みしてください。
        </p>
      </div>
    </div>
  );
}
