"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskProposalWithProposer } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Check,
  Clock,
  Lightbulb,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface TaskProposalManagerProps {
  roomId: string;
  proposals: TaskProposalWithProposer[];
  userRole: "PLANNER" | "PERFORMER";
  isMainPlanner: boolean;
}

export function TaskProposalManager({
  roomId,
  proposals,
  userRole,
  isMainPlanner,
}: TaskProposalManagerProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [reviewingProposal, setReviewingProposal] = useState<string | null>(
    null
  );
  const [reviewNote, setReviewNote] = useState("");

  const canPropose = userRole === "PERFORMER";
  const canReview = userRole === "PLANNER" || isMainPlanner;

  const handleCreateProposal = async () => {
    if (!title.trim()) {
      toast.error("タスクタイトルは必須です");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(`/api/rooms/${roomId}/task-proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success("提案を作成しました", {
        description: "プランナーがレビューします",
      });

      setTitle("");
      setDescription("");
      setIsCreateDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("エラー", {
        description: "タスク提案の作成に失敗しました",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleReviewProposal = async (
    proposalId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setReviewingProposal(proposalId);

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/task-proposals/${proposalId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            reviewNote: reviewNote.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      console.log("Review response:", data);

      toast.success(
        status === "APPROVED" ? "提案を承認しました" : "提案を拒否しました",
        {
          description: data.message,
        }
      );

      setReviewNote("");
      router.push(`/rooms/${roomId}/tasks/${data.task.id}/edit`);
    } catch (error) {
      console.error(error);
      toast.error("エラー", {
        description: "レビューの処理に失敗しました",
      });
    } finally {
      setReviewingProposal(null);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm("この提案を削除しますか？")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/task-proposals/${proposalId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success("提案を削除しました");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("エラー", {
        description: "提案の削除に失敗しました",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-yellow-700 border-yellow-300"
          >
            <Clock className="h-3 w-3 mr-1" />
            レビュー待ち
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-700 border-green-300">
            <Check className="h-3 w-3 mr-1" />
            承認済み
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-700 border-red-300">
            <X className="h-3 w-3 mr-1" />
            拒否
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            <CardTitle>タスク提案</CardTitle>
          </div>
          {canPropose && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  提案する
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新しいタスクを提案</DialogTitle>
                  <DialogDescription>
                    プランナーがレビューし、承認されればタスクが作成されます。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">タスクタイトル *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="例：数学の宿題を完了する"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">説明（任意）</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="タスクの詳細や目標を記入してください"
                      className="mt-1 min-h-20"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button onClick={handleCreateProposal} disabled={isCreating}>
                    {isCreating ? "作成中..." : "提案を作成"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <CardDescription>
          パフォーマーからのタスク提案一覧です。
          {canReview &&
            "承認されたタスクは自動的にタスクリストに追加されます。"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>まだタスク提案がありません</p>
            {canPropose && (
              <p className="text-sm mt-1">
                新しいタスクのアイデアがあれば提案してみてください
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-base">
                          {proposal.title}
                        </CardTitle>
                        {getStatusBadge(proposal.status)}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>
                          提案者:{" "}
                          {proposal.proposer.name || proposal.proposer.email}
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(proposal.createdAt), "MM/dd HH:mm", {
                            locale: ja,
                          })}
                        </span>
                      </div>
                    </div>
                    {canReview && proposal.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProposal(proposal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {proposal.description && (
                  <CardContent className="pt-0 pb-3">
                    <p className="text-sm text-muted-foreground">
                      {proposal.description}
                    </p>
                  </CardContent>
                )}

                {/* レビューノート表示 */}
                {proposal.reviewNote && (
                  <CardContent className="pt-0 pb-3">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center space-x-1 mb-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          レビューコメント
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {proposal.reviewNote}
                      </p>
                    </div>
                  </CardContent>
                )}

                {/* レビューアクション (プランナーのみ、未処理の提案のみ) */}
                {canReview && proposal.status === "PENDING" && (
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <Label htmlFor={`review-${proposal.id}`}>
                        レビューコメント（任意）
                      </Label>
                      <Textarea
                        id={`review-${proposal.id}`}
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="承認・拒否の理由やフィードバックを記入"
                        className="mt-1 min-h-16"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleReviewProposal(proposal.id, "APPROVED")
                        }
                        disabled={reviewingProposal === proposal.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        承認
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleReviewProposal(proposal.id, "REJECTED")
                        }
                        disabled={reviewingProposal === proposal.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        拒否
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
