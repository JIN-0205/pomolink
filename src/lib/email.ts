import { InvitationEmail } from "@/components/email/InvitationEmail";
import { render } from "@react-email/render";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "PomoLink";
const EMAIL_FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

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

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEYが設定されていません");
    if (IS_PRODUCTION) {
      console.error(
        "Resend APIキーが設定されていないため、メールは送信されません"
      );
      return false;
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

  try {
    const resend = new Resend(RESEND_API_KEY);

    console.log("メール送信を開始:", {
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `${roomName}への招待が届いています`,
    });

    let emailHtml: string;

    try {
      emailHtml = await render(
        InvitationEmail({
          roomName,
          senderName,
          inviteUrl,
          inviteCode,
          expiresAt,
        })
      );
    } catch (renderError) {
      console.warn(
        "React Emailのレンダリングに失敗しました。フォールバックHTMLを使用します:",
        renderError
      );

      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${roomName}への招待</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { background-color: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 30px; }
            .button { display: inline-block; background-color: #0070f3; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 20px 0; }
            .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header"><h1>PomoLink</h1></div>
          <div class="content">
            <h2>${roomName}への招待</h2>
            <p>${senderName}さんから「${roomName}」ルームへの招待が届いています。</p>
            <p>以下のボタンをクリックしてルームに参加できます：</p>
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">招待を受け入れる</a>
            </div>
            ${inviteCode ? `<p style="margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-radius: 4px;">招待コード: <strong>${inviteCode}</strong></p>` : ""}
            ${expiresAt ? `<p style="color: #666; font-size: 14px;">この招待は ${expiresAt.toLocaleDateString("ja-JP")} まで有効です。</p>` : ""}
          </div>
          <div class="footer">
            <p>このメールに心当たりがない場合は無視してください。</p>
            <p>© ${new Date().getFullYear()} PomoLink. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;
    }

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

    const { data, error } = await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `${roomName}への招待が届いています`,
      html: emailHtml,
      text: textContent,
    });

    if (error) {
      console.error("Resendエラー詳細:", {
        type: typeof error,
        error: error,
        name: error.name,
        message: error.message,
      });
      return false;
    }

    console.log("メール送信成功:", data?.id);
    return true;
  } catch (error) {
    console.error("メール送信エラー:", error);
    if (error instanceof Error) {
      console.error(`エラーメッセージ: ${error.message}`);
      console.error(`エラータイプ: ${error.name}`);
      console.error(`スタックトレース: ${error.stack}`);
    }
    return false;
  }
};

export function isValidEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
}
