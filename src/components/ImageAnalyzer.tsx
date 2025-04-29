// 例: app/components/ImageAnalyzer.tsx
"use client"; // クライアントコンポーネントとしてマーク

import { ChangeEvent, FormEvent, useRef, useState } from "react";
// 型定義をインポート (上記の types.ts からなど)
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorResponse, GeminiProcessedData } from "@/types"; // 型定義をインポート

function ImageAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeminiProcessedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // ファイルインプットのリセット用

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setResults(null); // 新しいファイルが選択されたら結果をクリア
      setError(null); // エラーもクリア
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("ファイルが選択されていません。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    // バックエンドの route.ts で `formData.get('image')` としているのでキーを 'image' に合わせる
    formData.append("image", selectedFile);

    try {
      const response = await fetch("/api/upload-note", {
        // バックエンドAPIのエンドポイント
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `エラーが発生しました (${response.status})`;
        try {
          // バックエンドがJSON形式でエラーメッセージを返している場合
          const errorData: ErrorResponse = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          // JSONパース失敗時はステータスコードのみ
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMsg);
      }

      // 成功した場合、レスポンスボディをパース
      const data: GeminiProcessedData = await response.json();
      setResults(data);
    } catch (err: unknown) {
      console.error("Analysis submission error:", err);
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました。"
      );
    } finally {
      setIsLoading(false);
      // ファイル選択をリセット (任意)
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null); // ファイル選択状態もリセット
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            学習ノート分析 & クイズ生成
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="imageUpload" className="block mb-2 font-medium">
                ノートの画像またはPDFを選択してください:
              </label>
              <input
                type="file"
                id="imageUpload"
                accept="image/jpeg, image/png, image/webp, application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={isLoading}
                className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold file:cursor-pointer disabled:opacity-50"
              />
            </div>
            <Button
              type="submit"
              disabled={!selectedFile || isLoading}
              className="w-full"
            >
              {isLoading ? "分析中..." : "分析を開始"}
            </Button>
          </form>

          {/* ローディング表示 */}
          {isLoading && (
            <div className="mt-6 flex flex-col items-center">
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
              <p className="mt-4 text-muted-foreground">
                分析中です。しばらくお待ちください...
              </p>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <p>エラー: {error}</p>
            </Alert>
          )}

          {/* 結果表示 */}
          {results && !error && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">分析結果</h3>

              {/* Gemini処理全体のエラー */}
              {results.geminiError && (
                <Alert variant="destructive" className="mb-4">
                  Gemini処理エラー: {results.geminiError}
                </Alert>
              )}

              {/* 要約 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-1">要約:</h4>
                <div className="bg-muted rounded p-3 whitespace-pre-wrap">
                  {results.summary || "要約がありません。"}
                </div>
              </div>

              {/* クイズ */}
              <div className="mb-6">
                <h4 className="font-semibold mb-1">習熟度テスト:</h4>
                {results.quizError && (
                  <Alert variant="destructive" className="mb-2">
                    クイズエラー: {results.quizError}
                  </Alert>
                )}
                {results.quiz && results.quiz.length > 0 ? (
                  <ul className="space-y-4">
                    {results.quiz.map((item, index) => (
                      <li
                        key={index}
                        className="border rounded p-4 bg-background"
                      >
                        <p className="font-medium mb-2">
                          問題 {index + 1}: {item.question}
                        </p>
                        <ul className="list-[lower-alpha] pl-6">
                          {item.options.map((option, optIndex) => (
                            <li key={optIndex}>{option}</li>
                          ))}
                        </ul>
                        {/* <p className="mt-2 text-sm text-muted-foreground"><em>正解: {item.answer}</em></p> */}
                      </li>
                    ))}
                  </ul>
                ) : (
                  !results.quizError && <p>クイズは生成されませんでした。</p>
                )}
              </div>

              {/* 元のテキスト（一部表示など） */}
              <div>
                <h4 className="font-semibold mb-1">
                  抽出されたテキスト (冒頭部分):
                </h4>
                <div className="text-sm text-muted-foreground max-h-32 overflow-auto bg-muted rounded p-3">
                  {results.fullText?.substring(0, 500)}...
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ImageAnalyzer;
