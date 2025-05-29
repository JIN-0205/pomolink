"use client";

import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            プロフィール設定
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            アカウント情報を管理し、プロフィール画像や個人情報を更新できます。
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0",
                navbar: "hidden",
                navbarMobileMenuButton: "hidden",
                headerTitle:
                  "text-xl font-semibold text-gray-900 dark:text-white",
                headerSubtitle: "text-gray-600 dark:text-gray-400",
                formButtonPrimary:
                  "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors",
                formButtonSecondary:
                  "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
                formFieldInput:
                  "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
                dividerLine: "bg-gray-200 dark:bg-gray-700",
                dividerText: "text-gray-500 dark:text-gray-400",
                accordionTriggerButton:
                  "text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700",
                accordionContent:
                  "border-t border-gray-200 dark:border-gray-700",
                tableHead: "text-gray-500 dark:text-gray-400",
                badge:
                  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
                avatarBox: "border-2 border-gray-200 dark:border-gray-600",
                profileSectionTitle:
                  "text-lg font-medium text-gray-900 dark:text-white",
                profileSectionContent: "text-gray-600 dark:text-gray-400",
              },
              layout: {
                showOptionalFields: true,
              },
            }}
            routing="virtual"
          />
        </div>
      </div>
    </div>
  );
}
