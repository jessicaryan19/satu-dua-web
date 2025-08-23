import DataCard from "@/components/cards/data-card";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { Report, ReportService } from "@/services/report-service";

export default function DashboardDataCard() {
    const { session } = useAuth();
    const { data: reports } = useSupabaseQuery<Report[]>(
        () => ReportService.getOperatorReports(session?.user?.id ?? ''),
        [session],
        { enabled: !!session?.user.id }
    );

    return (
        <div className="w-full flex gap-4 px-4 pb-4">
            <DataCard title="Total Laporan Hari Ini" value={reports?.length.toString() ?? "0"} icon="carbon:report" />
            <DataCard title="Total Antrian" value="127" icon="solar:incoming-call-bold" />
            <DataCard title="Waktu Respons" value="10 menit" icon="icon-park-solid:timer" theme="red" />
        </div>
    )
}