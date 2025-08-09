import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InvitationEmailProps {
  roomName: string;
  senderName: string;
  inviteUrl: string;
  inviteCode?: string;
  expiresAt?: Date;
}

export const InvitationEmail = ({
  roomName = "テストルーム",
  senderName = "テストユーザー",
  inviteUrl = "https://example.com",
  inviteCode,
  expiresAt,
}: InvitationEmailProps) => {
  const previewText = `${senderName}さんから${roomName}への招待が届いています`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Heading style={h1}>PomoLink</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>{roomName}への招待</Heading>
            <Text style={text}>
              {senderName}さんから「{roomName}」ルームへの招待が届いています。
            </Text>
            <Text style={text}>
              以下のボタンをクリックしてルームに参加できます：
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                招待を受け入れる
              </Button>
            </Section>

            {inviteCode && (
              <Section style={codeContainer}>
                <Text style={text}>
                  または、以下の招待コードを使用してルームに参加することもできます：
                </Text>
                <Text style={code}>{inviteCode}</Text>
              </Section>
            )}

            {expiresAt && (
              <Text style={expires}>
                この招待は{" "}
                {expiresAt.toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                まで有効です。
              </Text>
            )}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              このメールに心当たりがない場合は無視してください。
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} PomoLink. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// スタイル定義
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const content = {
  margin: "0 auto",
  padding: "0 32px",
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "32px 0 16px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#0070f3",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const codeContainer = {
  backgroundColor: "#f4f4f4",
  borderRadius: "4px",
  margin: "24px 0",
  padding: "16px",
};

const code = {
  backgroundColor: "#f4f4f4",
  fontSize: "18px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "8px 0",
};

const expires = {
  color: "#666",
  fontSize: "14px",
  margin: "24px 0 0",
};

const footer = {
  textAlign: "center" as const,
  margin: "32px 0 0",
  borderTop: "1px solid #eaeaea",
  paddingTop: "32px",
};

const footerText = {
  color: "#666",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "8px 0",
};

export default InvitationEmail;
