// interface EmailTemplateProps {
//   firstName: string;
//   inviterName: string;
//   projectName?: string;
//   inviteLink: string;
// }

// export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
//   firstName,
//   inviterName,
//   projectName,
//   inviteLink,
// }) => (
//   <div
//     style={{
//       fontFamily: "Arial, sans-serif",
//       maxWidth: "600px",
//       margin: "0 auto",
//       padding: "20px",
//       backgroundColor: "#f9f9f9",
//     }}
//   >
//     <div
//       style={{
//         backgroundColor: "#ffffff",
//         padding: "40px",
//         borderRadius: "8px",
//         boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
//       }}
//     >
//       {/* Header */}
//       <div style={{ textAlign: "center", marginBottom: "30px" }}>
//         <h1
//           style={{
//             color: "#2563eb",
//             fontSize: "28px",
//             fontWeight: "bold",
//             margin: "0 0 10px 0",
//           }}
//         >
//           PomoLink
//         </h1>
//         <p
//           style={{
//             color: "#6b7280",
//             fontSize: "16px",
//             margin: "0",
//           }}
//         >
//           ポモドーロテクニックで一緒に作業しませんか？
//         </p>
//       </div>

//       {/* Main Content */}
//       <div style={{ marginBottom: "30px" }}>
//         <h2
//           style={{
//             color: "#1f2937",
//             fontSize: "24px",
//             fontWeight: "bold",
//             marginBottom: "20px",
//           }}
//         >
//           こんにちは、{firstName}さん！
//         </h2>

//         <p
//           style={{
//             color: "#374151",
//             fontSize: "16px",
//             lineHeight: "1.6",
//             marginBottom: "20px",
//           }}
//         >
//           <strong>{inviterName}</strong>さんから、
//           {projectName ? (
//             <>
//               PomoLinkプロジェクト「<strong>{projectName}</strong>
//               」への招待が届きました。
//             </>
//           ) : (
//             <>PomoLinkでの共同作業への招待が届きました。</>
//           )}
//         </p>

//         <p
//           style={{
//             color: "#374151",
//             fontSize: "16px",
//             lineHeight: "1.6",
//             marginBottom: "30px",
//           }}
//         >
//           PomoLinkは、ポモドーロテクニックを使って仲間と一緒に集中して作業できるツールです。
//           一緒に生産性を向上させましょう！
//         </p>
//       </div>

//       {/* CTA Button */}
//       <div style={{ textAlign: "center", marginBottom: "30px" }}>
//         <a
//           href={inviteLink}
//           style={{
//             display: "inline-block",
//             backgroundColor: "#2563eb",
//             color: "#ffffff",
//             fontSize: "18px",
//             fontWeight: "bold",
//             padding: "16px 32px",
//             borderRadius: "8px",
//             textDecoration: "none",
//             transition: "background-color 0.2s",
//           }}
//         >
//           招待を受け入れる
//         </a>
//       </div>

//       {/* Features */}
//       <div
//         style={{
//           backgroundColor: "#f3f4f6",
//           padding: "20px",
//           borderRadius: "6px",
//           marginBottom: "30px",
//         }}
//       >
//         <h3
//           style={{
//             color: "#1f2937",
//             fontSize: "18px",
//             fontWeight: "bold",
//             marginBottom: "15px",
//           }}
//         >
//           PomoLinkでできること：
//         </h3>
//         <ul
//           style={{
//             color: "#374151",
//             fontSize: "14px",
//             lineHeight: "1.6",
//             margin: "0",
//             paddingLeft: "20px",
//           }}
//         >
//           <li style={{ marginBottom: "8px" }}>
//             みんなで同期したポモドーロタイマー
//           </li>
//           <li style={{ marginBottom: "8px" }}>リアルタイムでの作業状況共有</li>
//           <li style={{ marginBottom: "8px" }}>進捗の可視化と分析</li>
//           <li style={{ marginBottom: "8px" }}>チームでのモチベーション向上</li>
//         </ul>
//       </div>

//       {/* Footer */}
//       <div
//         style={{
//           borderTop: "1px solid #e5e7eb",
//           paddingTop: "20px",
//           textAlign: "center",
//         }}
//       >
//         <p
//           style={{
//             color: "#6b7280",
//             fontSize: "14px",
//             lineHeight: "1.6",
//             margin: "0 0 10px 0",
//           }}
//         >
//           このリンクは24時間有効です。期限が切れた場合は、{inviterName}
//           さんに再度招待をお願いしてください。
//         </p>
//         <p
//           style={{
//             color: "#6b7280",
//             fontSize: "12px",
//             margin: "0",
//           }}
//         >
//           このメールに心当たりがない場合は、無視してください。
//         </p>
//       </div>
//     </div>
//   </div>
// );

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
  inviterName: string;
  projectName?: string;
  inviteLink: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  inviterName,
  projectName,
  inviteLink,
}) => (
  <Tailwind
    config={{
      theme: {
        extend: {
          colors: {
            brand: "#2563eb",
          },
        },
      },
    }}
  >
    <Html lang="ja">
      <Head />
      <Preview>{inviterName}さんからPomoLinkへの招待が届いています</Preview>
      <Body className="bg-gray-100 font-sans">
        <Container className="bg-white mx-auto py-10 px-10 rounded-lg shadow-lg max-w-2xl">
          {/* Header */}
          <Section className="text-center mb-8">
            <Heading className="text-brand text-3xl font-bold mb-3 mt-0">
              PomoLink
            </Heading>
            <Text className="text-gray-500 text-base m-0">
              ポモドーロテクニックで一緒に作業しませんか？
            </Text>
          </Section>

          {/* Main Content */}
          <Section className="mb-8">
            <Heading className="text-gray-800 text-2xl font-bold mb-5 mt-0">
              こんにちは、{firstName}さん！
            </Heading>

            <Text className="text-gray-700 text-base leading-relaxed mb-5">
              <strong>{inviterName}</strong>さんから、
              {projectName ? (
                <>
                  PomoLinkプロジェクト「<strong>{projectName}</strong>
                  」への招待が届きました。
                </>
              ) : (
                <>PomoLinkでの共同作業への招待が届きました。</>
              )}
            </Text>

            <Text className="text-gray-700 text-base leading-relaxed mb-8">
              PomoLinkは、ポモドーロテクニックを使って仲間と一緒に集中して作業できるツールです。
              一緒に生産性を向上させましょう！
            </Text>
          </Section>

          {/* CTA Button */}
          <Section className="text-center mb-8">
            <Link
              href={inviteLink}
              className="inline-block bg-brand text-white text-lg font-bold py-4 px-8 rounded-lg no-underline"
            >
              招待を受け入れる
            </Link>
          </Section>

          {/* Features */}
          <Section className="bg-gray-100 p-5 rounded-md mb-8">
            <Heading className="text-gray-800 text-lg font-bold mb-4 mt-0">
              PomoLinkでできること：
            </Heading>
            <Text className="text-gray-700 text-sm leading-relaxed m-0">
              • みんなで同期したポモドーロタイマー
              <br />
              • リアルタイムでの作業状況共有
              <br />
              • 進捗の可視化と分析
              <br />• チームでのモチベーション向上
            </Text>
          </Section>

          {/* Footer */}
          <Section className="border-t border-gray-200 pt-5 text-center">
            <Text className="text-gray-500 text-sm leading-relaxed mb-3 mt-0">
              このリンクは24時間有効です。期限が切れた場合は、{inviterName}
              さんに再度招待をお願いしてください。
            </Text>
            <Text className="text-gray-500 text-xs m-0">
              このメールに心当たりがない場合は、無視してください。
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

export default EmailTemplate;
