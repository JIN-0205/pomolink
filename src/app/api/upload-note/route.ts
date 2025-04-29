import {
  DocumentProcessorServiceClient,
  protos,
} from "@google-cloud/documentai";
import { VertexAI } from "@google-cloud/vertexai"; // Vertex AI をインポート
import { NextRequest, NextResponse } from "next/server";

// --- 環境変数 (存在確認を強化) ---
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = process.env.GOOGLE_CLOUD_REGION || "us"; // デフォルト 'us'
const PROCESSOR_ID = process.env.DOCAI_PROCESSOR_ID;
const GEMINI_MODEL = "gemini-1.5-pro-preview-0409"; // または最新のモデル

// --- 型定義 ---

// Document AI から抽出する基本データの型
interface ExtractedDocAIData {
  fullText: string; // 成功時は必須とする
  // 必要に応じて他の構造化データも追加:
  // pages?: protos.google.cloud.documentai.v1.Document.IPage[];
  // entities?: protos.google.cloud.documentai.v1.IEntity[];
}

// クイズアイテムの型 (例)
interface QuizItem {
  question: string;
  options: string[];
  answer: string;
}

// Gemini 処理後の統合データ型
interface GeminiProcessedData extends ExtractedDocAIData {
  summary: string;
  quiz?: QuizItem[]; // 成功時はクイズ配列
  quizError?: string; // クイズ生成/解析エラー時
  geminiError?: string; // Gemini 呼び出し全体のエラー時
}

// API成功レスポンスの型
type SuccessResponseData = GeminiProcessedData;

// APIエラーレスポンスの型
interface ErrorResponse {
  message: string;
}

// --- ヘルパー関数: Document AI レスポンス処理 (ステップ4) ---
function extractDataFromDocAI(
  document: protos.google.cloud.documentai.v1.IDocument | null | undefined
): ExtractedDocAIData | { error: string } {
  // エラーオブジェクトも返す可能性
  if (!document?.text) {
    // document自体がないか、textがない場合
    return { error: "Document AI response does not contain document text." };
  }
  const fullText = document.text;

  // ここで必要に応じて pages, entities などを抽出・整形
  // const pagesData = ...
  // const entitiesData = ...

  // 必須の fullText を含むオブジェクトを返す
  return {
    fullText: fullText,
    // pages: pagesData,
    // entities: entitiesData
  };
}

// --- ヘルパー関数: Vertex AI Gemini 呼び出し (ステップ5) ---
async function callGeminiForLearning(
  docData: ExtractedDocAIData // 型付けされた入力
): Promise<GeminiProcessedData> {
  // 型付けされた出力 Promise<T>
  // Vertex AI クライアント初期化 (PROJECT_IDとLOCATIONの存在確認を追加)
  if (!PROJECT_ID) throw new Error("Missing GOOGLE_CLOUD_PROJECT_ID env var.");
  const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  const generativeModel = vertex_ai.getGenerativeModel({ model: GEMINI_MODEL });

  const fullText = docData.fullText;
  let summary: string = "N/A";
  let quizData: QuizItem[] | undefined;
  let quizErrorMsg: string | undefined;
  let geminiErrorMsg: string | undefined;

  try {
    // --- まとめノート生成（要約） ---
    const summaryPrompt = `あなたは優秀な学習サポーターです。以下の学習ノートの内容をもとに、重要なポイントを3つにまとめた「まとめノート」を日本語で作成してください。各ポイントは箇条書きで簡潔に記述してください。\n\n---\n${fullText.substring(0, 10000)}\n---`;
    console.log("Calling Gemini for Summary...");
    const summaryResp = await generativeModel.generateContent(summaryPrompt);

    // --- デバッグログ追加: Summary レスポンス全体 ---
    console.log("--- Raw Summary Response ---");
    console.log(JSON.stringify(summaryResp, null, 2));
    console.log("----------------------------");

    summary =
      summaryResp.response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "まとめノートの生成に失敗しました。";
    console.log("Summary generated.");
    console.log("Summary response text:", summary); // テキスト部分のみのログ

    // --- クイズ生成 ---
    const quizPrompt = `あなたは学習ノートから習熟度テストを作成するAIです。以下の内容をもとに、日本語で三択クイズを3問作成してください。各問題には必ず正解の選択肢（answer）と簡単な解説（explanation）を含めてください。出力は必ず次のJSON形式の配列のみで、余計な説明やマークダウンは一切含めないでください。\n\n形式例:[{\"question\":\"問題文\",\"options\":["選択肢A","選択肢B","選択肢C"],\"answer\":\"正解の選択肢\",\"explanation\":\"解説文\"}]\n\n---\n${fullText.substring(0, 10000)}\n---`;
    console.log("Calling Gemini for Quiz...");
    const quizResp = await generativeModel.generateContent(quizPrompt);

    // --- デバッグログ追加: Quiz レスポンス全体 ---
    console.log("--- Raw Quiz Response ---");
    console.log(JSON.stringify(quizResp, null, 2));
    console.log("----------------------------");

    let quizJsonText =
      quizResp.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (quizJsonText) {
      // --- デバッグログ追加: Quiz レスポンスのテキスト部分 ---
      console.log("--- Raw Quiz Response Text ---");
      console.log(quizJsonText);
      console.log("----------------------------");

      try {
        // 先頭・末尾のマークダウンや不要な文字を除去
        quizJsonText = quizJsonText
          .replace(/^```json[\r\n]*/i, "")
          .replace(/^```[\r\n]*/i, "")
          .replace(/```$/, "")
          .trim();
        // JSON パース試行
        const parsedQuiz = JSON.parse(quizJsonText);
        console.log("Parsed quiz JSON:", parsedQuiz);

        if (
          Array.isArray(parsedQuiz) &&
          parsedQuiz.every(
            (item) => item.question && item.options && item.answer
          )
        ) {
          quizData = parsedQuiz as QuizItem[];
        } else {
          throw new Error("Parsed JSON is not a valid QuizItem array.");
        }
        console.log("Quiz generated and parsed.");
      } catch (parseError: unknown) {
        console.error(
          "Failed to parse quiz JSON:",
          parseError,
          "\nRaw Text:",
          quizJsonText
        );
        quizErrorMsg = `クイズデータの解析に失敗しました: ${
          parseError instanceof Error
            ? parseError.message
            : "Unknown parsing error"
        }`;
      }
    } else {
      console.log("Quiz generation response did not contain text.");
      quizErrorMsg = "クイズ生成の応答が空でした。";
    }

    // --- 他の Gemini 処理 (正規化など) があればここに追加 ---
  } catch (error: unknown) {
    console.error("Error calling/processing Gemini:", error);
    // ここでエラーオブジェクト全体をログ出力すると、より詳細な情報が得られる場合がある
    console.error("Full error object:", error);
    geminiErrorMsg = `Gemini API 呼び出しまたは処理中にエラー: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }

  // 結果を統合して返す
  return {
    ...docData, // 元の抽出データを展開
    summary: summary,
    quiz: quizData, // 成功すれば配列、失敗すれば undefined
    quizError: quizErrorMsg, // クイズのエラーメッセージ
    geminiError: geminiErrorMsg, // 全体のGeminiエラーメッセージ
  };
}

// --- API Route Handler ---
export async function POST(
  req: NextRequest
): Promise<NextResponse<SuccessResponseData | ErrorResponse>> {
  // レスポンスの型を指定
  console.log("--- API Route Handler Started ---");

  // --- 環境変数チェック ---
  if (!PROJECT_ID || !PROCESSOR_ID) {
    console.error(
      "Missing required environment variables: GOOGLE_CLOUD_PROJECT_ID or DOCAI_PROCESSOR_ID"
    );
    return NextResponse.json(
      { message: "Server configuration error." },
      { status: 500 }
    );
  }
  console.log("Environment variables checked.");

  try {
    // --- ファイル取得 ---
    console.log("Attempting to get formData...");

    const formData = await req.formData();
    const file = formData.get("image") as File | null; // フロントエンドの input name="image" を想定
    if (!file) {
      console.log("File not found in formData.");
      return NextResponse.json(
        { message: "画像ファイルが必要です ('image' key)" },
        { status: 400 }
      );
    }
    console.log("File received:", file.name, file.size, file.type);
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;

    // --- Document AI クライアント設定 ---
    console.log("Initializing Document AI client...");
    const clientOptions =
      LOCATION !== "us"
        ? { apiEndpoint: `${LOCATION}-documentai.googleapis.com` }
        : {};
    const client = new DocumentProcessorServiceClient(clientOptions);
    const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;
    console.log("Document AI client initialized. Processor name:", name);

    // --- Document AI リクエスト作成 ---
    const request: protos.google.cloud.documentai.v1.IProcessRequest = {
      name,
      rawDocument: { content: buffer, mimeType },
    };

    // --- ステップ3: Document AI API 呼び出し ---
    console.log("Calling Document AI API...");
    const [result] = await client.processDocument(request);
    console.log("Document AI API response received."); // レスポンス受信確認
    // Document AI のレスポンス全体は大きい場合があるので、必要に応じて部分的にログ出力
    // console.log(`Document AI raw result: ${JSON.stringify(result, null, 2)}`);

    // --- ステップ4: Document AI レスポンス処理 ---
    console.log("Extracting data from Document AI response (Step 4)...");
    const extractedResult = extractDataFromDocAI(result.document);

    // extractDataFromDocAI がエラーオブジェクトを返した場合
    if ("error" in extractedResult) {
      console.error(
        "Error extracting data from Document AI:",
        extractedResult.error
      );
      return NextResponse.json(
        { message: `Document AI 処理エラー: ${extractedResult.error}` },
        { status: 500 }
      );
    }
    const intermediateData: ExtractedDocAIData = extractedResult; // 型アサーション（成功時）
    console.log(
      "Intermediate data created (fullText length:",
      intermediateData.fullText.length,
      ")."
    );

    // --- ステップ5: Vertex AI Gemini API 呼び出し ---
    console.log("Calling Vertex AI Gemini (Step 5)...");
    const finalProcessedData: GeminiProcessedData =
      await callGeminiForLearning(intermediateData);
    console.log("Gemini processing complete.");
    // Gemini 処理でエラーが発生した場合も、エラー情報を含んだ finalProcessedData が返る

    // Gemini 処理で致命的なエラーが発生しているかチェック
    if (finalProcessedData.geminiError) {
      console.error(
        "Gemini processing reported an error:",
        finalProcessedData.geminiError
      );
      // Gemini 処理エラーをフロントエンドに返す
      return NextResponse.json(
        { message: `Gemini 処理エラー: ${finalProcessedData.geminiError}` },
        { status: 500 } // サーバーサイドでのエラーとして返す
      );
    }

    // --- ステップ6 & 7: 最終結果をフロントエンドに返す ---
    console.log("Sending final response to frontend.");
    // Gemini処理で致命的なエラーがなければ、生成されたデータ（エラー情報含む）を返す
    return NextResponse.json(finalProcessedData);
  } catch (error: unknown) {
    console.error("Error in POST handler catch block:", error);
    // catch ブロックで捕捉されたエラーをフロントエンドに返す
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: message }, { status: 500 });
  }
}
