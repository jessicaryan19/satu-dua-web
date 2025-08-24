import DataCard from "@/components/cards/data-card";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { Report, ReportService } from "@/services/report-service";

interface DashboardDataCardProps {
  queueCount?: number;
  averageResponseTime?: string;
}

export default function DashboardDataCard({ 
  queueCount = 0, 
  averageResponseTime = "0 menit" 
}: DashboardDataCardProps) {
    const { session } = useAuth();
    const { data: reports } = useSupabaseQuery<Report[]>(
        () => ReportService.getOperatorReports(session?.user?.id ?? ''),
        [session],
        { enabled: !!session?.user.id }
    );

    // Determine theme for response time based on performance
    const getResponseTimeTheme = (responseTime: string): 'blue' | 'red' => {
        if (responseTime.includes('detik') || responseTime.startsWith('1 menit') || responseTime.startsWith('2 menit')) {
            return 'blue'; // Good response time
        } else {
            return 'red'; // Poor response time
        }
    };

    return (
        <div className="w-full flex gap-4 px-4 pb-4">
            <DataCard 
                title="Total Laporan Hari Ini" 
                value={reports?.length.toString() ?? "0"} 
                icon="carbon:report" 
            />
            <DataCard 
                title="Total Antrian" 
                value={queueCount.toString()} 
                icon="solar:incoming-call-bold"
                theme={queueCount > 5 ? 'red' : 'blue'}
            />
            <DataCard 
                title="Waktu Respons" 
                value={averageResponseTime} 
                icon="icon-park-solid:timer" 
                theme={getResponseTimeTheme(averageResponseTime)}
            />
        </div>
    )
}