# 録画制限プロセス - 修正後の仕様

## 問題の概要

以前のシステムでは、フリープランのルーム作成者であっても、そのルームのパフォーマーが1日に複数回録画できてしまう問題がありました。

## 修正内容

### 1. 録画制限の二重チェック

`canRecord`関数を修正して、以下の両方をチェックするようにしました：

1. **ルーム全体の制限**: ルーム作成者のプランに基づく日次録画制限
2. **ユーザー個人の制限**: 録画を行うユーザー個人の日次録画制限（不正利用防止）

### 2. 新しい関数の追加

```typescript
// ルーム全体の日次録画回数を取得
export async function getRoomDailyRecordingCount(
  roomId: string
): Promise<number>;

// 修正されたcanRecord関数（戻り値に制限タイプと理由を追加）
export async function canRecord(
  roomId: string,
  userId: string
): Promise<{
  canRecord: boolean;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
  limitType: "USER" | "ROOM";
  reason?: string;
}>;
```

### 3. 制限チェックのロジック

1. **ルーム制限を優先チェック**: ルーム作成者のプランに基づく制限
2. **ユーザー制限も確認**: 個人の録画制限も同時にチェック
3. **どちらかが制限に達している場合は録画を拒否**

### 4. エラーメッセージの改善

- 制限タイプ（ルーム制限 vs ユーザー制限）を区別
- 具体的な理由をメッセージに含める
- フロントエンドでの適切な表示に対応

## 修正されたファイル

### バックエンド

- `src/lib/subscription-service.ts`: 制限チェック機能の修正
- `src/app/api/recording-upload/route.ts`: エラーレスポンスの改善

### フロントエンド

- `src/components/subscription/SubscriptionLimitModal.tsx`: 録画制限タイプの表示対応

## 制限プロセスの流れ

### 録画アップロード時

1. **認証チェック**: ユーザーがログインしているか確認
2. **セッション確認**: 対象のセッションが存在し、権限があるか確認
3. **録画制限チェック**:
   - ルーム全体の日次録画回数をチェック
   - ユーザー個人の日次録画回数をチェック
   - どちらかが制限に達している場合はエラーを返す
4. **ファイルサイズチェック**: 100MB以下かチェック
5. **アップロード実行**: Firebase Storageにアップロード
6. **使用量記録**: `recordingUsage`テーブルに記録

### エラーレスポンス例

```json
{
  "error": "ルーム全体の日次録画制限に達しました",
  "code": "RECORDING_LIMIT_EXCEEDED",
  "currentCount": 1,
  "maxCount": 1,
  "planType": "FREE",
  "limitType": "ROOM"
}
```

## プランごとの制限

| プラン  | 日次録画回数 | 参加者数 | ルーム作成数 |
| ------- | ------------ | -------- | ------------ |
| FREE    | 1回          | 2人      | 1個          |
| BASIC   | 6回          | 4人      | 4個          |
| PREMIUM | 15回         | 10人     | 10個         |

## データベース構造

### RecordingUsage テーブル

```sql
- id: 主キー
- userId: 録画を行ったユーザー
- sessionId: 関連するセッション（nullable）
- date: 録画日時
- fileSize: ファイルサイズ（bytes）
- duration: 録画時間（秒）
```

### 制限チェッククエリ例

```typescript
// ルーム全体の日次録画数
const count = await prisma.recordingUsage.count({
  where: {
    session: {
      task: {
        roomId: roomId,
      },
    },
    date: {
      gte: today,
      lt: tomorrow,
    },
  },
});
```

## 今後の拡張

1. **月次制限**: 必要に応じて月次制限も追加可能
2. **ファイルサイズ制限**: プランごとに異なるファイルサイズ制限
3. **録画時間制限**: セッション単位の録画時間制限
4. **保存期間制限**: プランごとの録画ファイル保存期間

この修正により、フリープランのルームでは確実に1日1回の録画制限が適用されるようになりました。
