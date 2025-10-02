# Vercel 環境変数運用ミニマムガイド

目的: `npx vercel env add FIREBASE_PRIVATE_KEY production` 等のコマンドを安全 & 再現性高く実行するための最小手順。
余計な情報は省き、(1) 初期セットアップ, (2) 追加/更新/削除, (3) 本番反映 の 3 本柱。

---

## 1. セットアップ (最初に 1 回 or 環境再構築時)

```
# (A) Vercel CLI インストール (プロジェクトローカル推奨)
pnpm add -D vercel
# あるいはグローバル: npm i -g vercel

# (B) ログイン (ブラウザで認可)
npx vercel login

# (C) プロジェクト関連付け (未リンクの場合のみ)
npx vercel link
# => Scope / Project を聞かれるので既存の pomolink を選択

# (D) 動作確認 (Production 環境変数一覧)
npx vercel env ls production

# (E) 変更前バックアップ (推奨)
npx vercel env pull ./backup.env.production --environment=production
```

問題なく一覧が表示できれば以降の add / rm コマンドが使用可能。

---

## 2. 追加 / 更新 / 削除 コマンド

### 2-1. 追加 (単一)

```
npx vercel env add VARIABLE_NAME production
```

対話で値を貼り付けて Enter。`FIREBASE_PRIVATE_KEY` など複数行値もそのまま貼り付け可能。

### 2-2. 複数行シークレット (FIREBASE_PRIVATE_KEY)

方式 A (推奨): PEM 原文をそのまま貼る (BEGIN/END 含む)。コード側で `process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')` などをしている場合は `.env` との整合を確認。

方式 B: Base64 化して改行事故防止。

```
base64 -i firebase_private_key.pem | pbcopy
npx vercel env add FIREBASE_PRIVATE_KEY_B64 production
```

アプリ側復号:

```
const key = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64!, 'base64').toString('utf8');
```

### 2-3. 更新

Vercel は「上書き」が無いので 削除 → 再追加。

```
npx vercel env rm FIREBASE_PRIVATE_KEY production --yes
npx vercel env add FIREBASE_PRIVATE_KEY production
```

### 2-4. 削除

```
npx vercel env rm VARIABLE_NAME production
```

削除前に必ずバックアップに残っているかを確認:

```
grep VARIABLE_NAME backup.env.production || echo "値未バックアップ"
```

---

## 3. 本番へ反映 (適用)

環境変数を変更しても既存本番デプロイには即反映されない。新しい本番デプロイを生成する。

### 3-1. 即時デプロイ (CLI)

```
npx vercel deploy --prod
```

現在のワークツリー内容 (main HEAD) で Production デプロイが作成される。

### 3-2. Git 経由

main ブランチへ push (プロジェクト設定で自動 Production デプロイ有効な場合)。

### 3-3. 反映確認

1. デプロイ完了後、管理画面か `vercel logs` で起動エラーが無いか確認
2. アプリ内ヘルスエンドポイント / 重要 API を 1,2 個叩いて 200 を確認
3. クリティカル変数 (DB 接続, Firebase, Resend 等) の機能動作をスポットテスト

### 3-4. ロールバック (問題発生時)

```
npx vercel list --prod   # 過去デプロイ確認
y# ↑から対象の URL / デプロイ ID を GUI で Promote も可
```

(頻度高くなったら別途 Rollback 手順書を作成)

---

最終更新日: 2025-08-17
