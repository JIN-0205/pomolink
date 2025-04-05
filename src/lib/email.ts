import nodemailer from "nodemailer";

interface InvitationEmailParams {
  email: string;
  senderName: string;
  roomName: string;
  inviteUrl: string;
  inviteCode?: string; // 招待コード（オプション）
  expiresAt?: Date; // 有効期限
}

/**
 * 招待メールを送信する関数
 * @param params 招待メールのパラメータ
 * @returns 送信結果のPromise
 */
export async function sendInvitationEmail(
  params: InvitationEmailParams
): Promise<boolean> {
  const { email, senderName, roomName, inviteUrl, inviteCode, expiresAt } =
    params;

  try {
    // 環境変数から設定を読み込む
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.example.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASSWORD || "",
      },
    });

    // 有効期限のテキスト
    const expirationText = expiresAt
      ? `この招待は${expiresAt.toLocaleDateString()}まで有効です。`
      : "この招待には有効期限があります。";

    // 招待コードの表示（あれば）
    const inviteCodeText = inviteCode ? `招待コード: ${inviteCode}` : "";

    // メール内容の設定
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || "スケジュール管理アプリ"}" <${
        process.env.SMTP_FROM_EMAIL || "no-reply@example.com"
      }>`,
      to: email,
      subject: `${roomName}へのご招待`,
      text: `
        ${email}様
        
        ${senderName}さんから「${roomName}」へご招待されました。
        
        以下のリンクから招待を確認し、参加してください。
        ${inviteUrl}
        
        ${inviteCodeText ? inviteCodeText + "\n" : ""}
        ${expirationText}
        
        このメールに心当たりがない場合は無視してください。
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${roomName}へのご招待</h2>
          <p>こんにちは ${email}様</p>
          <p>${senderName}さんから「${roomName}」へご招待されました。</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; text-align: center;">
            ${inviteCodeText ? `<p><strong>${inviteCodeText}</strong></p>` : ""}
            <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
              招待を確認する
            </a>
          </div>
          <p><em>${expirationText}</em></p>
          <p style="font-size: 0.8em; color: #666;">このメールに心当たりがない場合は無視してください。</p>
        </div>
      `,
    };

    // メール送信
    const info = await transporter.sendMail(mailOptions);
    console.log("Invitation email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return false;
  }
}
