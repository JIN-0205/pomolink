// 例: app/page.tsx

import ImageAnalyzer from "@/components/ImageAnalyzer";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">学習ノート分析アプリ</h1>
      <ImageAnalyzer />
    </main>
  );
}
