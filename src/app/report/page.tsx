import AIContainerCard from "@/components/cards/ai-container-card";
import OngoingCallCard from "@/components/cards/ongoing-call-card";
import ReportFormCard from "@/components/cards/report-form-card";

export default function Report() {
    return (
        <div className="flex w-full h-full gap-4">
            <div className="w-1/3 h-full flex flex-col flex-1 py-4 gap-6">
                <OngoingCallCard />
                <AIContainerCard/>
            </div>
            <div className="w-2/3 h-full py-4 flex flex-col gap-6">
                <ReportFormCard/>
            </div>
        </div>
    )
}