"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlarmPreset, playAlarm } from "@/lib/audio";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    workAlarmSound: "buzzer" as AlarmPreset,
    breakAlarmSound: "kalimba" as AlarmPreset,
  });
  const [, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/users/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<typeof settings>) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (res.ok) {
        const updatedSettings = await res.json();
        setSettings(updatedSettings);
        toast("設定を保存しました");
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast("エラー", { description: "設定の保存に失敗しました" });
    } finally {
      setIsLoading(false);
    }
  };

  const alarmOptions = [
    { value: "buzzer", label: "ブザー" },
    { value: "siren", label: "サイレン" },
    { value: "retro", label: "レトロ" },
    { value: "kalimba", label: "カリンバ" },
    { value: "levelup", label: "レベルアップ" },
  ];

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>タイマー設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">作業終了音</label>
            <div className="flex gap-2">
              <Select
                value={settings.workAlarmSound}
                onValueChange={(value: AlarmPreset) => {
                  setSettings((prev) => ({ ...prev, workAlarmSound: value }));
                  updateSettings({ workAlarmSound: value });
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {alarmOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => playAlarm(settings.workAlarmSound)}
              >
                試聴
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">休憩終了音</label>
            <div className="flex gap-2">
              <Select
                value={settings.breakAlarmSound}
                onValueChange={(value: AlarmPreset) => {
                  setSettings((prev) => ({ ...prev, breakAlarmSound: value }));
                  updateSettings({ breakAlarmSound: value });
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {alarmOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => playAlarm(settings.breakAlarmSound)}
              >
                試聴
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
