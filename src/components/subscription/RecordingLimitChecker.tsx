"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PlanType } from "@prisma/client";
import { AlertCircle, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { UpgradeDialog } from "./UpgradeDialog";

interface RecordingLimitCheckerProps {
  onCanRecord: (canRecord: boolean) => void;
  children: React.ReactNode;
}

interface RecordingLimit {
  canRecord: boolean;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
}

export function RecordingLimitChecker({
  onCanRecord,
  children,
}: RecordingLimitCheckerProps) {
  const [recordingLimit, setRecordingLimit] = useState<RecordingLimit | null>(
    null
  );
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkRecordingLimit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/recording-upload");
      if (response.ok) {
        const data = await response.json();
        setRecordingLimit(data);
        onCanRecord(data.canRecord);

        if (!data.canRecord) {
          setShowUpgradeDialog(true);
        }
      }
    } catch (error) {
      console.error("録画制限チェックエラー:", error);
      onCanRecord(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkRecordingLimit();
  }, []);

  if (isLoading) {
    return (
      <Button disabled>
        <Video className="mr-2 h-4 w-4" />
        チェック中...
      </Button>
    );
  }

  if (recordingLimit && !recordingLimit.canRecord) {
    return (
      <>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            今日の録画制限に達しました ({recordingLimit.currentCount}/
            {recordingLimit.maxCount})
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={() => setShowUpgradeDialog(true)}
            >
              アップグレード
            </Button>
          </AlertDescription>
        </Alert>

        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          currentPlan={recordingLimit.planType}
          limitType="recording"
          currentCount={recordingLimit.currentCount}
          maxCount={recordingLimit.maxCount}
        />
      </>
    );
  }

  return (
    <>
      {children}
      {recordingLimit && (
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          currentPlan={recordingLimit.planType}
          limitType="recording"
          currentCount={recordingLimit.currentCount}
          maxCount={recordingLimit.maxCount}
        />
      )}
    </>
  );
}
