// // app/api/analyze-image/route.ts
// import { ImageAnnotatorClient, protos } from "@google-cloud/vision";
// import { NextRequest, NextResponse } from "next/server";

// // Vision APIからのレスポンスの型を定義（必要に応じて拡張）
// // protos からインポートするとより厳密に型付け可能
// type LabelAnnotation = protos.google.cloud.vision.v1.IEntityAnnotation;
// type FaceAnnotation = protos.google.cloud.vision.v1.IFaceAnnotation;
// type TextAnnotation = protos.google.cloud.vision.v1.ITextAnnotation;
// type ObjectAnnotation =
//   protos.google.cloud.vision.v1.ILocalizedObjectAnnotation;
// type WebDetection = protos.google.cloud.vision.v1.IWebDetection;

// // フロントエンドに返すJSONの型
// interface AnalysisResult {
//   labels?: LabelAnnotation[] | null;
//   faces?: FaceAnnotation[] | null;
//   text?: TextAnnotation | null;
//   objects?: ObjectAnnotation[] | null;
//   web?: WebDetection | null;
//   // 他の分析結果があれば追加
// }

// // エラーレスポンスの型
// interface ErrorResponse {
//   message: string;
//   error?: unknown;
// }

// export async function POST(
//   req: NextRequest
// ): Promise<NextResponse<AnalysisResult | ErrorResponse>> {
//   // クライアントを初期化 (環境変数は自動で読み込まれる)
//   // 必要であれば、クライアントの初期化時に認証情報を明示的に渡すことも可能
//   // const client = new ImageAnnotatorClient({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
//   const client = new ImageAnnotatorClient();

//   let image: protos.google.cloud.vision.v1.IImage;
//   let analysisTypes: string[] = ["LABEL_DETECTION", "FACE_DETECTION"]; // デフォルト
//   const contentType = req.headers.get("content-type") || "";

//   try {
//     // 画像データの取得
//     if (contentType.includes("multipart/form-data")) {
//       // ファイルアップロードの場合
//       const formData = await req.formData();
//       const file = formData.get("image") as File | null; // 'image' はフロントエンドのFormDataキー

//       if (!file) {
//         return NextResponse.json(
//           { message: "Image file is required." },
//           { status: 400 }
//         );
//       }
//       const buffer = Buffer.from(await file.arrayBuffer());
//       image = { content: buffer };
//       // analysisTypesも受け取る
//       const types = formData.getAll("analysisTypes");
//       if (types && types.length > 0) {
//         analysisTypes = types.map((t) => String(t));
//       }
//     } else if (contentType.includes("application/json")) {
//       // 画像URLの場合
//       const body = await req.json();
//       const { imageUrl, analysisTypes: types } = body;
//       if (!imageUrl || typeof imageUrl !== "string") {
//         return NextResponse.json(
//           { message: "imageUrl (string) is required in JSON body." },
//           { status: 400 }
//         );
//       }
//       image = { source: { imageUri: imageUrl } };
//       if (Array.isArray(types) && types.length > 0) {
//         analysisTypes = types;
//       }
//     } else {
//       return NextResponse.json(
//         {
//           message:
//             "Unsupported Content-Type. Use multipart/form-data or application/json.",
//         },
//         { status: 415 }
//       );
//     }

//     // Vision API リクエスト作成
//     const typeMap: Record<string, protos.google.cloud.vision.v1.Feature.Type> =
//       {
//         LABEL_DETECTION:
//           protos.google.cloud.vision.v1.Feature.Type.LABEL_DETECTION,
//         FACE_DETECTION:
//           protos.google.cloud.vision.v1.Feature.Type.FACE_DETECTION,
//         TEXT_DETECTION:
//           protos.google.cloud.vision.v1.Feature.Type.TEXT_DETECTION,
//         OBJECT_LOCALIZATION:
//           protos.google.cloud.vision.v1.Feature.Type.OBJECT_LOCALIZATION,
//         WEB_DETECTION: protos.google.cloud.vision.v1.Feature.Type.WEB_DETECTION,
//       };
//     const features: protos.google.cloud.vision.v1.IFeature[] = analysisTypes
//       .filter((t) => typeMap[t])
//       .map((t) => ({ type: typeMap[t] }));
//     if (features.length === 0) {
//       return NextResponse.json(
//         { message: "No valid analysisTypes specified." },
//         { status: 400 }
//       );
//     }

//     const request: protos.google.cloud.vision.v1.IAnnotateImageRequest = {
//       image: image,
//       features: features,
//     };

//     // API 呼び出し
//     const [result] = await client.annotateImage(request);

//     // エラーチェック
//     if (result.error) {
//       console.error("Vision API Error:", result.error);
//       return NextResponse.json(
//         { message: "Vision API Error", error: result.error },
//         { status: 500 }
//       );
//     }

//     // 成功レスポンス
//     const responseData: AnalysisResult = {
//       labels: result.labelAnnotations ?? null,
//       faces: result.faceAnnotations ?? null,
//       text: result.fullTextAnnotation ?? null,
//       objects: result.localizedObjectAnnotations ?? null,
//       web: result.webDetection ?? null,
//     };
//     return NextResponse.json(responseData);
//   } catch (error: unknown) {
//     console.error("Error processing image analysis:", error);
//     const message =
//       error instanceof Error ? error.message : "Internal Server Error";
//     return NextResponse.json({ message, error }, { status: 500 });
//   }
// }
