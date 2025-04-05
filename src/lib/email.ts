import { Resend } from "resend";

// 環境変数のチェック
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "PomoLink";
const EMAIL_FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// 起動時に警告を表示（本番環境のみ）
if (IS_PRODUCTION && !RESEND_API_KEY) {
  console.error(
    "警告: 本番環境でRESEND_API_KEYが設定されていません。メール送信機能は動作しません。"
  );
}

interface InvitationEmailParams {
  email: string;
  roomName: string;
  senderName: string;
  inviteUrl: string;
  inviteCode?: string;
  expiresAt?: Date;
}

/**
 * 招待メールを送信する関数
 * @param params 招待メールのパラメータ
 * @returns 送信成功の場合はtrue、失敗の場合はfalse
 */
export const sendInvitationEmail = async (
  params: InvitationEmailParams
): Promise<boolean> => {
  const { email, senderName, roomName, inviteUrl, inviteCode, expiresAt } =
    params;

  // APIキーが設定されていない場合の処理
  if (!RESEND_API_KEY) {
    if (IS_PRODUCTION) {
      console.error(
        "Resend APIキーが設定されていないため、メールは送信されません"
      );
      return false; // 本番環境では失敗を返す
    } else {
      // 開発環境ではシミュレーションモード
      console.log(
        "======== 📧 デバッグモード: メール送信シミュレーション ========"
      );
      console.log(`宛先: ${email}`);
      console.log(`件名: ${roomName}への招待`);
      console.log(`送信者: ${senderName}`);
      console.log(`ルーム名: ${roomName}`);
      console.log(`招待リンク: ${inviteUrl}`);
      if (inviteCode) console.log(`招待コード: ${inviteCode}`);
      if (expiresAt)
        console.log(`有効期限: ${expiresAt.toLocaleString("ja-JP")}`);
      console.log("==========================================");
      return true; // 開発環境では成功を返す
    }
  }

  // HTMLメールテンプレート
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${roomName}への招待</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 20px;
        }
        .content {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background-color: #0070f3;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          text-align: center;
          margin-top: 30px;
        }
        .info {
          margin: 20px 0;
          padding: 15px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }
        .expires {
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PomoLink</h1>
      </div>

      <div class="content">
        <h2>${roomName}への招待</h2>
        <p>${senderName}さんから「${roomName}」ルームへの招待が届いています。</p>
        <p>以下のボタンをクリックしてルームに参加できます：</p>

        <div style="text-align: center;">
          <a href="${inviteUrl}" class="button">招待を受け入れる</a>
        </div>

        ${
          inviteCode
            ? `
        <div class="info">
          <p>または、以下の招待コードを使用してルームに参加することもできます：</p>
          <p style="font-weight: bold; font-size: 18px;">${inviteCode}</p>
        </div>
        `
            : ""
        }

        ${
          expiresAt
            ? `
        <p class="expires">
          この招待は ${expiresAt.toLocaleString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })} まで有効です。
        </p>
        `
            : ""
        }
      </div>

      <div class="footer">
        <p>このメールに心当たりがない場合は無視してください。</p>
        <p>© ${new Date().getFullYear()} PomoLink. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  // プレーンテキスト版（テキストメールのフォールバック用）
  const textContent = `
${roomName}への招待

${senderName}さんから「${roomName}」ルームへの招待が届いています。
以下のURLからルームに参加できます：
${inviteUrl}

${inviteCode ? `招待コード: ${inviteCode}` : ""}
${expiresAt ? `有効期限: ${expiresAt.toLocaleString("ja-JP")}` : ""}

このメールに心当たりがない場合は無視してください。
© ${new Date().getFullYear()} PomoLink
  `.trim();

  try {
    // Resendインスタンスを作成
    const resend = new Resend(RESEND_API_KEY);

    // メールを送信（リトライ機能付き）
    return await sendWithRetry(resend, {
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `${roomName}への招待が届いています`,
      html: emailHtml,
      text: textContent,
    });
  } catch (error) {
    console.error("メール送信エラー:", error);
    // エラー詳細をより詳しくログに残す
    if (error instanceof Error) {
      console.error(`エラーメッセージ: ${error.message}`);
      console.error(`エラータイプ: ${error.name}`);
      console.error(`スタックトレース: ${error.stack}`);
    }
    return false;
  }
};

/**
 * リトライ機能付きメール送信
 * 一定回数失敗した場合に再試行する
 */
async function sendWithRetry(
  resend: Resend,
  emailData: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  },
  maxRetries = 3,
  delayMs = 1000
): Promise<boolean> {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      attempts++;

      // 送信を試行
      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        console.warn(
          `メール送信エラー (試行 ${attempts}/${maxRetries}):`,
          error
        );

        // 最後の試行だった場合はエラーを返す
        if (attempts >= maxRetries) {
          console.error("メール送信の最大試行回数に達しました:", error);
          return false;
        }

        // 待機してから再試行
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // 成功した場合
      console.log("メール送信成功:", data?.id);
      return true;
    } catch (error) {
      console.warn(`メール送信例外 (試行 ${attempts}/${maxRetries}):`, error);

      // 最後の試行だった場合は例外を投げる
      if (attempts >= maxRetries) {
        throw error;
      }

      // 待機してから再試行
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

/**
 * Eメールアドレスのバリデーション
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
}
