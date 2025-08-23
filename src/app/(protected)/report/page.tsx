"use client";
import AIContainerCard from "@/components/cards/ai-container-card";
import OngoingCallCard from "@/components/cards/ongoing-call-card";
import ReportFormCard from "@/components/cards/report-form-card";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export default function Report() {
  const { session } = useAuth();
  const operatorId = session?.user.id; // Get from auth context

  // AI analysis and recommendation states
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiRecommendation, setAiRecommendation] = useState<string>("");

  const resultTempExample = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

  return (
    <div className="flex w-full h-full gap-4">
      <div className="w-1/3 h-full flex flex-col ps-4 gap-4">
        <OngoingCallCard />
        <AIContainerCard
          title="Analisa Kejadian"
          result={aiAnalysis}
        />
        <AIContainerCard
          title="Rekomendasi"
          result={aiRecommendation || resultTempExample}
        />
      </div>
      <div className="w-2/3 h-full flex flex-col gap-6">
        <ReportFormCard
          aiAnalysis={aiAnalysis}
          aiRecommendation={aiRecommendation || resultTempExample}
          operatorId={operatorId ?? "No Operator"}
        />
      </div>
    </div>
  );
}
