// // app/components/ImageAnalyzer.tsx
// "use client";

// import { protos } from "@google-cloud/vision"; // 型のためにインポート
// import { ChangeEvent, FormEvent, useState } from "react";

// // バックエンドから返される分析結果の型 (API Route の AnalysisResult と合わせる)
// type LabelAnnotation = protos.google.cloud.vision.v1.IEntityAnnotation;
// type FaceAnnotation = protos.google.cloud.vision.v1.IFaceAnnotation;
// type TextAnnotation = protos.google.cloud.vision.v1.ITextAnnotation;
// type ObjectAnnotation =
//   protos.google.cloud.vision.v1.ILocalizedObjectAnnotation;
// type WebDetection = protos.google.cloud.vision.v1.IWebDetection;

// interface AnalysisData {
//   labels?: LabelAnnotation[] | null;
//   faces?: FaceAnnotation[] | null;
//   text?: TextAnnotation | null;
//   objects?: ObjectAnnotation[] | null;
//   web?: WebDetection | null;
// }

// const ANALYSIS_OPTIONS = [
//   { key: "LABEL_DETECTION", label: "ラベル検出" },
//   { key: "FACE_DETECTION", label: "顔検出" },
//   { key: "TEXT_DETECTION", label: "テキスト検出" },
//   { key: "OBJECT_LOCALIZATION", label: "物体検出" },
//   { key: "WEB_DETECTION", label: "Web特徴検出" },
// ];

// function ImageAnalyzer() {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [imageUrl, setImageUrl] = useState<string>("");
//   const [results, setResults] = useState<AnalysisData | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [analysisType, setAnalysisType] = useState<"file" | "url">("file");
//   const [analysisTypes, setAnalysisTypes] = useState<string[]>([
//     "LABEL_DETECTION",
//   ]);
//   const [previewUrl, setPreviewUrl] = useState<string>("");

//   const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files[0]) {
//       setSelectedFile(event.target.files[0]);
//       setImageUrl("");
//       setPreviewUrl(URL.createObjectURL(event.target.files[0]));
//     }
//   };

//   const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
//     setImageUrl(event.target.value);
//     setSelectedFile(null);
//     setPreviewUrl(event.target.value);
//   };

//   const handleAnalysisTypeChange = (key: string) => {
//     setAnalysisTypes((prev) =>
//       prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
//     );
//   };

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     if (analysisType === "file" && !selectedFile) {
//       setError("画像ファイルを選択してください。");
//       return;
//     }
//     if (analysisType === "url" && !imageUrl) {
//       setError("画像のURLを入力してください。");
//       return;
//     }
//     if (analysisTypes.length === 0) {
//       setError("少なくとも1つの分析タイプを選択してください。");
//       return;
//     }
//     setIsLoading(true);
//     setError(null);
//     setResults(null);
//     try {
//       let response: Response;
//       if (analysisType === "file" && selectedFile) {
//         const formData = new FormData();
//         formData.append("image", selectedFile);
//         analysisTypes.forEach((t) => formData.append("analysisTypes", t));
//         response = await fetch("/api/analyze-image", {
//           method: "POST",
//           body: formData,
//         });
//       } else if (analysisType === "url" && imageUrl) {
//         response = await fetch("/api/analyze-image", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ imageUrl, analysisTypes }),
//         });
//       } else {
//         throw new Error("Invalid state for submission.");
//       }
//       if (!response.ok) {
//         let errorMsg = `HTTP error! status: ${response.status}`;
//         try {
//           const errorData = await response.json();
//           errorMsg = errorData.message || errorMsg;
//         } catch {}
//         throw new Error(errorMsg);
//       }
//       const data: AnalysisData = await response.json();
//       setResults(data);
//     } catch (err: unknown) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : "分析中に不明なエラーが発生しました。"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto my-8 p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
//       <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">
//         Cloud Vision API 画像分析
//       </h2>
//       <form onSubmit={handleSubmit} className="space-y-4 mb-6">
//         <div className="flex gap-6 items-center">
//           <label className="flex items-center gap-1 font-medium">
//             <input
//               type="radio"
//               value="file"
//               checked={analysisType === "file"}
//               onChange={() => setAnalysisType("file")}
//               className="accent-blue-600"
//             />
//             ファイルアップロード
//           </label>
//           <label className="flex items-center gap-1 font-medium">
//             <input
//               type="radio"
//               value="url"
//               checked={analysisType === "url"}
//               onChange={() => setAnalysisType("url")}
//               className="accent-blue-600"
//             />
//             画像URL
//           </label>
//         </div>
//         {analysisType === "file" && (
//           <div className="flex items-center gap-2">
//             <label htmlFor="imageFile" className="font-medium w-24">
//               画像ファイル:
//             </label>
//             <input
//               type="file"
//               id="imageFile"
//               accept="image/*"
//               onChange={handleFileChange}
//               className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//             />
//           </div>
//         )}
//         {analysisType === "url" && (
//           <div className="flex items-center gap-2">
//             <label htmlFor="imageUrl" className="font-medium w-24">
//               画像URL:
//             </label>
//             <input
//               type="url"
//               id="imageUrl"
//               value={imageUrl}
//               onChange={handleUrlChange}
//               placeholder="https://..."
//               className="w-72 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-zinc-800 dark:text-white"
//             />
//           </div>
//         )}
//         <div className="flex flex-wrap gap-4 items-center">
//           <span className="font-medium">分析タイプ:</span>
//           {ANALYSIS_OPTIONS.map((opt) => (
//             <label
//               key={opt.key}
//               className="flex items-center gap-1 text-sm font-medium"
//             >
//               <input
//                 type="checkbox"
//                 checked={analysisTypes.includes(opt.key)}
//                 onChange={() => handleAnalysisTypeChange(opt.key)}
//                 className="accent-blue-600"
//               />
//               {opt.label}
//             </label>
//           ))}
//         </div>
//         <button
//           type="submit"
//           disabled={
//             isLoading ||
//             (analysisType === "file" && !selectedFile) ||
//             (analysisType === "url" && !imageUrl) ||
//             analysisTypes.length === 0
//           }
//           className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition"
//         >
//           {isLoading ? "分析中..." : "画像を分析"}
//         </button>
//       </form>
//       {previewUrl && (
//         <div className="mb-6 text-center">
//           <img
//             src={previewUrl}
//             alt="プレビュー"
//             className="inline-block max-w-xs max-h-60 rounded-lg border border-zinc-200 shadow"
//           />
//         </div>
//       )}
//       {error && (
//         <p className="text-red-600 font-semibold mb-4">エラー: {error}</p>
//       )}
//       {results && (
//         <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
//           <h3 className="text-lg font-bold mb-2 text-blue-700 dark:text-blue-300">
//             分析結果:
//           </h3>
//           {results.labels && results.labels.length > 0 && (
//             <div className="mb-3">
//               <h4 className="font-semibold text-blue-600 dark:text-blue-300">
//                 ラベル検出:
//               </h4>
//               <ul className="list-disc ml-6">
//                 {results.labels.map((label) => (
//                   <li key={label.mid}>
//                     {label.description}{" "}
//                     <span className="text-xs text-zinc-500">
//                       ({(label.score! * 100).toFixed(1)}%)
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//           {results.faces && results.faces.length > 0 && (
//             <div className="mb-3">
//               <h4 className="font-semibold text-blue-600 dark:text-blue-300">
//                 顔検出:
//               </h4>
//               <p>{results.faces.length} 個の顔</p>
//             </div>
//           )}
//           {results.text && results.text.text && (
//             <div className="mb-3">
//               <h4 className="font-semibold text-blue-600 dark:text-blue-300">
//                 テキスト検出:
//               </h4>
//               <pre className="bg-zinc-100 dark:bg-zinc-900 rounded p-2 text-sm whitespace-pre-wrap">
//                 {results.text.text}
//               </pre>
//             </div>
//           )}
//           {results.objects && results.objects.length > 0 && (
//             <div className="mb-3">
//               <h4 className="font-semibold text-blue-600 dark:text-blue-300">
//                 物体検出:
//               </h4>
//               <ul className="list-disc ml-6">
//                 {results.objects.map((obj, i) => (
//                   <li key={i}>
//                     {obj.name}{" "}
//                     <span className="text-xs text-zinc-500">
//                       ({(obj.score! * 100).toFixed(1)}%)
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//           {results.web && (
//             <div className="mb-3">
//               <h4 className="font-semibold text-blue-600 dark:text-blue-300">
//                 Web特徴検出:
//               </h4>
//               {results.web.webEntities &&
//                 results.web.webEntities.length > 0 && (
//                   <ul className="list-disc ml-6">
//                     {results.web.webEntities.map((entity, i) => (
//                       <li key={i}>
//                         {entity.description || "(説明なし)"}{" "}
//                         {entity.score ? (
//                           <span className="text-xs text-zinc-500">
//                             ({(entity.score * 100).toFixed(1)}%)
//                           </span>
//                         ) : (
//                           ""
//                         )}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               {results.web.bestGuessLabels &&
//                 results.web.bestGuessLabels.length > 0 && (
//                   <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
//                     <strong>Best Guess:</strong>{" "}
//                     {results.web.bestGuessLabels.map((l) => l.label).join(", ")}
//                   </div>
//                 )}
//             </div>
//           )}
//           {!results.labels?.length &&
//             !results.faces?.length &&
//             !results.text?.text &&
//             !results.objects?.length &&
//             !results.web && <p>関連する特徴は検出されませんでした。</p>}
//         </div>
//       )}
//     </div>
//   );
// }

// export default ImageAnalyzer;
