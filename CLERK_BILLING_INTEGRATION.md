# Clerk Billing Integration

このプロジェクトでは、Clerkのbilling機能と既存のsubscription systemを統合しています。

## アーキテクチャ概要

### 1. 新しいClerk統合ファイル

- `src/lib/clerk-plan-service.ts` - Clerkのプラン管理を統合する中心的なサービス
- `src/lib/api-plan-helpers.ts` - API route用のヘルパー関数
- `src/hooks/usePlanInfo.tsx` - React hooks for client-side plan information
- `src/components/subscription/PlanUsageWidget.tsx` - プラン使用状況表示コンポーネント

### 2. 更新されたファイル

- `src/lib/subscription-service.ts` - Clerk統合を含むように更新
- `src/app/(protected)/pricing/page.tsx` - 新しいClerk PricingTableを使用
- `src/app/api/subscription/usage/route.ts` - Clerkプラン情報を含むように更新

## プラン名マッピング

| Clerk Plan Name | Internal Plan Type | Description      |
| --------------- | ------------------ | ---------------- |
| `free`          | `FREE`             | フリープラン     |
| `basic_user`    | `BASIC`            | ベーシックプラン |
| `premium_user`  | `PRO`              | プレミアムプラン |

## 使用方法

### サーバーサイド

```typescript
import {
  getCurrentPlanDetails,
  hasMinimumPlan,
} from "@/lib/clerk-plan-service";

// プラン詳細を取得
const planDetails = await getCurrentPlanDetails();
console.log(planDetails.planType); // "FREE" | "BASIC" | "PRO"
console.log(planDetails.limits.maxDailyRecordings); // 1, 3, or 6

// 最小プラン要件をチェック
const hasBasicAccess = await hasMinimumPlan("BASIC");
```

### API Routes

```typescript
import {
  checkPlanAccess,
  createPlanLimitResponse,
} from "@/lib/api-plan-helpers";

export async function GET(req: NextRequest) {
  const access = await checkPlanAccess(req, "BASIC");

  if (!access.hasAccess) {
    return createPlanLimitResponse(access.planType, "BASIC");
  }

  // BASIC以上のプランでのみアクセス可能な処理
}
```

### Client Components

```tsx
import { usePlanInfo, FeatureGate } from "@/hooks/usePlanInfo";

function MyComponent() {
  const { planInfo, loading } = usePlanInfo();

  return (
    <FeatureGate
      requiredPlan="BASIC"
      fallback={<div>ベーシックプランが必要です</div>}
    >
      <div>ベーシック以上の機能</div>
    </FeatureGate>
  );
}
```

## 主要機能

### 1. 自動プラン同期

- Clerkから最新のプラン情報を取得
- データベースと自動同期
- エラー時は既存のデータベース情報にフォールバック

### 2. 統一されたプラン管理

- 一箇所でプラン制限を管理
- 複数の場所で一貫したプラン情報を提供
- 機能制限のチェックを簡単に実装

### 3. UI Components

- プラン使用状況の表示
- 機能ゲート（プラン要件チェック）
- アップグレード促進

## 注意事項

1. **Clerkプラン設定**: Clerkダッシュボードでプラン名を正確に設定する必要があります
2. **エラーハンドリング**: Clerkからの情報取得に失敗した場合、フリープランが返されます
3. **データベース同期**: プラン変更時にデータベースが自動で更新されます

## 今後の拡張

- Webhookによるリアルタイムプラン更新
- より詳細な使用量分析
- カスタムプランの追加
- 使用量ベースの制限アラート
