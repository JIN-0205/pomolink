"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPlanName, PLAN_LIMITS } from "@/lib/subscription-limits";
import { PlanType } from "@prisma/client";
import { Crown, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  subscription: {
    planType: PlanType;
    maxDailyRecordings: number;
    maxParticipants: number;
    recordingRetentionDays: number;
  };
}

export function AdminSubscriptionManager() {
  const [searchEmail, setSearchEmail] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/admin/users/search?email=${encodeURIComponent(searchEmail)}`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast("エラー", {
          description: "ユーザーの検索に失敗しました",
        });
      }
    } catch (error) {
      console.error("User search failed:", error);
      toast("エラー", {
        description: "ユーザーの検索に失敗しました",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const updateUserPlan = async (userId: string, newPlan: PlanType) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: newPlan,
          ...PLAN_LIMITS[newPlan],
        }),
      });

      if (response.ok) {
        // ユーザーリストを更新
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  subscription: {
                    planType: newPlan,
                    ...PLAN_LIMITS[newPlan],
                  },
                }
              : user
          )
        );
        toast("成功", {
          description: "プランを更新しました",
        });
      } else {
        throw new Error("Plan update failed");
      }
    } catch (error) {
      console.error("Plan update failed:", error);
      toast("エラー", {
        description: "プランの更新に失敗しました",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            サブスクリプション管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ユーザー検索 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-email">
                ユーザー検索（メールアドレス）
              </Label>
              <Input
                id="search-email"
                type="email"
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={searchUsers}
                disabled={isSearching || !searchEmail.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                検索
              </Button>
            </div>
          </div>

          {/* ユーザーリスト */}
          {users.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">検索結果</h4>
              {users.map((user) => (
                <Card key={user.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {user.id}
                        </p>
                      </div>
                      <Badge
                        variant={
                          user.subscription.planType === "FREE"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {getPlanName(user.subscription.planType)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`plan-${user.id}`}>プラン変更</Label>
                        <Select
                          value={user.subscription.planType}
                          onValueChange={(value) =>
                            updateUserPlan(user.id, value as PlanType)
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="プランを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">Free</SelectItem>
                            <SelectItem value="BASIC">Basic</SelectItem>
                            <SelectItem value="PRO">Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">録画制限:</span>{" "}
                          {user.subscription.maxDailyRecordings}件/日
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">参加者制限:</span>{" "}
                          {user.subscription.maxParticipants}人
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">保存期間:</span>{" "}
                          {user.subscription.recordingRetentionDays}日
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {users.length === 0 && searchEmail && !isSearching && (
            <p className="text-center text-muted-foreground py-4">
              ユーザーが見つかりませんでした
            </p>
          )}
        </CardContent>
      </Card>

      {/* プラン概要 */}
      <Card>
        <CardHeader>
          <CardTitle>プラン概要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(PLAN_LIMITS).map(([plan, limits]) => (
              <div key={plan} className="border rounded-lg p-4">
                <h4 className="font-medium text-center mb-3">
                  {getPlanName(plan as PlanType)}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>録画:</span>
                    <span>{limits.maxDailyRecordings}件/日</span>
                  </div>
                  <div className="flex justify-between">
                    <span>参加者:</span>
                    <span>{limits.maxParticipants}人</span>
                  </div>
                  <div className="flex justify-between">
                    <span>保存期間:</span>
                    <span>{limits.recordingRetentionDays}日</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>価格:</span>
                    <span>¥{limits.price}/月</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
