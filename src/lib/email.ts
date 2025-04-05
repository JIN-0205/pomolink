import { Resend } from "resend";

interface InvitationEmailParams {
  email: string;
  senderName: string;
  roomName: string;
  inviteUrl: string;
  inviteCode?: string;
  expiresAt?: Date;
}

export async function sendInvitationEmail(
  params: InvitationEmailParams
): Promise<boolean> {
  const { email, senderName, roomName, inviteUrl, inviteCode, expiresAt } =
    params;

  // APIキーが設定されているか確認
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log(
      "⚠️ RESEND_API_KEYが設定されていないため、デバッグモードで実行します"
    );
    console.log("======== 送信するメール内容 ========");
    console.table({
      to: email,
      subject: `${roomName}への招待が届いています`,
      from: `${process.env.EMAIL_FROM_NAME || "PomoLink"} <${
        process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev"
      }>`,
      content: `${senderName}さんからの招待（${roomName}）`,
      inviteUrl,
      inviteCode: inviteCode || "なし",
    });
    console.log("===================================");
    return true; // デバッグモードでは成功したとみなす
  }

  try {
    // Resendインスタンスの初期化
    const resend = new Resend(resendApiKey);
    console.log("Resendインスタンス作成完了");

    // メールテンプレート
    const emailTemplate = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${roomName}への招待</h2>
        <p>${senderName}があなたを「${roomName}」ルームに招待しました。</p>
        <p>以下のリンクからルームに参加できます：</p>
        <div style="margin: 30px 0;">
          <a 
            href="${inviteUrl}" 
            style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;"
          >
            ルームに参加する
          </a>
        </div>
        ${inviteCode ? `<p>招待コード: <strong>${inviteCode}</strong></p>` : ""}
        ${
          expiresAt
            ? `<p>招待の有効期限: ${expiresAt.toLocaleString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</p>`
            : ""
        }
        <p style="color: #666; font-size: 14px;">
          このメールに心当たりがない場合は無視してください。
        </p>
      </div>
    `;

    // 送信元アドレスとして使用するメールアドレス
    const fromEmail = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
    const fromName = process.env.EMAIL_FROM_NAME || "PomoLink";
    const from = `${fromName} <${fromEmail}>`;

    console.log("メール送信準備完了:", { from, to: email });

    // Resendでメール送信
    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: `${roomName}への招待が届いています`,
      html: emailTemplate,
    });

    if (error) {
      console.error("Resendエラー詳細:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("✅ メール送信成功:", data);
    return true;
  } catch (error) {
    console.error("❌ メール送信エラー詳細:", error);

    // エラーオブジェクトの詳細情報を出力
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("エラースタック:", error.stack);
    } else {
      console.error("不明なエラー形式:", typeof error);
    }

    return false;
  }
}
