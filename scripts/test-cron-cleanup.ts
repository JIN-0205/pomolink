/**
 * 開発環境でcronジョブ（cleanup-recordings）をテストするスクリプト
 */

async function testCleanupRecordings() {
  const url = "http://localhost:3000/api/cron/cleanup-recordings";

  try {
    console.log("🔄 Testing cleanup-recordings cron job...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || "test-secret"}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📊 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      return;
    }

    const result = await response.json();
    console.log("✅ Success:", result);
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
}

// 環境変数をチェック
if (!process.env.CRON_SECRET) {
  console.warn(
    "⚠️  CRON_SECRET environment variable is not set. Using default test value."
  );
}

// スクリプトを実行
testCleanupRecordings();
