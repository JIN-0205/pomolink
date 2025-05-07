"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Session, Task, Upload } from "@/types";
import { format } from "date-fns";
import { Clock, Play } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface TaskDetailProps {
  task: Task;
  sessions: Session[];
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, sessions }) => {
  const router = useRouter();
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedImageGroup, setSelectedImageGroup] = useState<Upload[]>([]);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0);

  // 提出物（画像）一覧を初回取得
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}/upload`);
        if (res.ok) {
          const data = await res.json();
          setUploads(data.uploads || []);
        }
      } catch (e) {
        console.error("提出物取得エラー:", e);
      }
    };
    fetchUploads();
  }, [task.id]);

  // 画像アップロード
  const handleImageUpload = async () => {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]);
      }
      if (uploadDesc) formData.append("description", uploadDesc);
      const res = await fetch(`/api/tasks/${task.id}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploads((prev) => [...data.uploads, ...prev]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploadDesc("");
        toast("提出物をアップロードしました");
      } else {
        toast("エラー", { description: "提出物のアップロードに失敗しました" });
      }
    } catch (e) {
      console.error("提出物アップロードエラー:", e);
      toast("エラー", { description: "提出物のアップロードに失敗しました" });
    } finally {
      setUploadLoading(false);
    }
  };

  // 日付ごとに提出物とセッションをまとめてグループ化
  const groupedByDate = useMemo(() => {
    // 1. 提出物を日付ごとにグループ化
    const uploadsByDate: Record<string, Upload[]> = uploads.reduce(
      (acc, upload) => {
        const date = format(new Date(upload.createdAt), "yyyy-MM-dd");
        if (!acc[date]) acc[date] = [];
        acc[date].push(upload);
        return acc;
      },
      {} as Record<string, Upload[]>
    );
    // 2. セッションも日付ごとにグループ化
    const sessionsByDate: Record<string, Session[]> = sessions.reduce(
      (acc, session) => {
        const date = format(new Date(session.startTime), "yyyy-MM-dd");
        if (!acc[date]) acc[date] = [];
        acc[date].push(session);
        return acc;
      },
      {} as Record<string, Session[]>
    );
    // 3. 日付のユニーク集合
    const allDates = Array.from(
      new Set([...Object.keys(uploadsByDate), ...Object.keys(sessionsByDate)])
    );
    allDates.sort((a, b) => b.localeCompare(a)); // 新しい順
    // 4. 日付ごとにまとめて返す
    return allDates.map((date) => ({
      date,
      uploads: uploadsByDate[date] || [],
      sessions: sessionsByDate[date] || [],
    }));
  }, [uploads, sessions]);

  // ポモドーロページに遷移する関数
  const startPomodoro = async () => {
    try {
      // 訪問APIは廃止、直接ポモドーロページへ遷移
      router.push(`/rooms/${task.roomId}/pomodoro?taskId=${task.id}`);
    } catch (error) {
      console.error(error);
      toast("エラー", { description: "ポモドーロ開始に失敗しました" });
    }
  };

  // 画像クリック時にインデックスとグループもセット
  const handleImageClick = useCallback((fileUrl: string, uploads: Upload[]) => {
    const idx = uploads.findIndex((u) => u.fileUrl === fileUrl);
    setSelectedImage(fileUrl);
    setSelectedImageIndex(idx >= 0 ? idx : 0);
    setSelectedImageGroup(uploads);
  }, []);

  useEffect(() => {
    if (api && selectedImage && selectedImageGroup.length > 0) {
      api.scrollTo(selectedImageIndex);
    }
  }, [api, selectedImage, selectedImageIndex, selectedImageGroup]);

  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{task.title}</h3>
            <div className="flex space-x-2">
              <Badge
                variant={
                  task.priority === "HIGH"
                    ? "destructive"
                    : task.priority === "MEDIUM"
                      ? "default"
                      : "outline"
                }
              >
                {task.priority === "HIGH"
                  ? "高優先度"
                  : task.priority === "MEDIUM"
                    ? "中優先度"
                    : "低優先度"}
              </Badge>
              <Badge
                variant={
                  task.status === "COMPLETED"
                    ? "secondary"
                    : task.status === "IN_PROGRESS"
                      ? "default"
                      : "outline"
                }
              >
                {task.status === "COMPLETED"
                  ? "完了"
                  : task.status === "IN_PROGRESS"
                    ? "進行中"
                    : "未着手"}
              </Badge>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div>見積もりポモ数: {task.estimatedPomos ?? "-"}</div>
            <div>完了ポモ数: {task.completedPomos}</div>
            <div>
              期限:{" "}
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
            </div>
          </div>

          {/* ポモドーロ開始ボタン */}
          <div className="pt-2">
            <Button
              onClick={startPomodoro}
              className="w-full"
              variant="default"
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              <Clock className="mr-2 h-4 w-4" />
              このタスクでポモドーロを開始
            </Button>
          </div>

          {/* 提出物アップロードUI */}
          <div className="mb-6">
            <h4 className="text-base font-semibold mb-2">提出物アップロード</h4>
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                disabled={uploadLoading}
                multiple
              />
              <input
                type="text"
                className="border rounded p-2 text-sm flex-1"
                placeholder="説明 (任意)"
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                disabled={uploadLoading}
              />
              <Button onClick={handleImageUpload} disabled={uploadLoading}>
                アップロード
              </Button>
            </div>
          </div>

          {/* 日付ごとにTabsで提出物・セッション履歴を切り替え */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2">
              日ごとの提出物・セッション履歴
            </h4>
            <Accordion
              type="multiple"
              defaultValue={groupedByDate.length ? [groupedByDate[0].date] : []}
            >
              {groupedByDate.map(({ date, uploads, sessions }) => (
                <AccordionItem value={date} key={date}>
                  <AccordionTrigger>
                    <div className="flex flex-col sm:flex-row sm:items-center w-full justify-between">
                      <span className="font-semibold">
                        {format(new Date(date), "yyyy年MM月dd日 (EEE)")}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 sm:mt-0 sm:ml-4">
                        {uploads.length > 0 && `${uploads.length}件の提出物`}
                        {uploads.length > 0 && sessions.length > 0 && "・"}
                        {sessions.length > 0 && `${sessions.length}ポモ`}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Tabs
                      defaultValue={uploads.length > 0 ? "uploads" : "sessions"}
                      className="w-full"
                    >
                      <TabsList className="mb-2">
                        <TabsTrigger value="uploads">提出物</TabsTrigger>
                        <TabsTrigger value="sessions">
                          セッション履歴
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="uploads">
                        {uploads.length > 0 ? (
                          <ScrollArea
                            style={{ maxHeight: 400, overflowY: "auto" }}
                            className="pr-2"
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {uploads.map((upload) => (
                                <div
                                  key={upload.id}
                                  className="border rounded p-2 bg-muted cursor-pointer hover:shadow-lg transition"
                                  onClick={() =>
                                    handleImageClick(upload.fileUrl, uploads)
                                  }
                                >
                                  <Image
                                    src={upload.fileUrl}
                                    alt={upload.description || "uploaded image"}
                                    width={200}
                                    height={120}
                                    className="w-full h-32 object-cover rounded mb-1"
                                  />
                                  {upload.description && (
                                    <div className="text-xs text-muted-foreground mb-1">
                                      {upload.description}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(
                                      upload.createdAt
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            この日の提出物はありません。
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="sessions">
                        {sessions.length > 0 ? (
                          <ScrollArea
                            style={{ maxHeight: 400, overflowY: "auto" }}
                            className="pr-2"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="border rounded p-2"
                                >
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>
                                      開始:{" "}
                                      {new Date(
                                        session.startTime
                                      ).toLocaleTimeString()}
                                    </span>
                                    {session.endTime && (
                                      <span>
                                        終了:{" "}
                                        {new Date(
                                          session.endTime
                                        ).toLocaleTimeString()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex justify-start items-center mb-1">
                                    <div className="mb-1">
                                      {session.completed ? (
                                        <Badge variant="secondary">完了</Badge>
                                      ) : (
                                        <Badge variant="outline">未完了</Badge>
                                      )}
                                    </div>
                                    {session.recordingDuration && (
                                      <div className="ml-2 text-xs text-muted-foreground">
                                        {session.recordingDuration}min
                                      </div>
                                    )}
                                  </div>
                                  {session.recordingUrl && (
                                    <video
                                      src={session.recordingUrl}
                                      controls
                                      crossOrigin="anonymous"
                                      className="w-full h-auto rounded mb-2"
                                    />
                                  )}
                                  {session.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      メモ: {session.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            この日のセッション履歴はありません。
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
        <Dialog
          open={!!selectedImage}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedImage(null);
              setSelectedImageIndex(0);
              setSelectedImageGroup([]);
            }
          }}
        >
          <DialogContent className="max-w-2xl flex flex-col items-center">
            <DialogTitle>提出物一覧</DialogTitle>
            {selectedImage && selectedImageGroup.length > 0 && (
              <div className="mx-auto w-full max-w-xl">
                <Carousel setApi={setApi} className="w-full max-w-xl">
                  <CarouselContent>
                    {selectedImageGroup.map((upload) => (
                      <CarouselItem
                        key={upload.id}
                        className="flex items-center justify-center"
                      >
                        <Card className="w-full h-[60vh] flex items-center justify-center bg-background shadow-none">
                          <CardContent className="flex items-center justify-center w-full h-full p-0">
                            <Image
                              src={upload.fileUrl}
                              alt={upload.description || "uploaded image"}
                              width={800}
                              height={600}
                              className="object-contain w-full h-full rounded"
                              style={{ maxHeight: "56vh", maxWidth: "100%" }}
                            />
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
                <div className="py-2 text-center text-sm text-muted-foreground">
                  {current} / {count}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TaskDetail;
