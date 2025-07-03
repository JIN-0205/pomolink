import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

// 管理者ルートの定義（将来的な拡張用）
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// APIルートの保護
const isProtectedApiRoute = createRouteMatcher([
  "/api/rooms(.*)",
  "/api/users(.*)",
  "/api/pomodoro(.*)",
  "/api/tasks(.*)",
  "/api/points(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 管理者ルートの保護（権限ベースの認証）
  if (isAdminRoute(req)) {
    await auth.protect((has) => {
      return has({ role: "admin" }) || has({ permission: "admin:access" });
    });
    return;
  }

  // 保護されたAPIルートの認証
  if (isProtectedApiRoute(req)) {
    await auth.protect();
    return;
  }

  // その他の保護されたルート
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
