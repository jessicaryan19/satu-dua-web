import ReportCard, { ReportStatus } from "@/components/cards/report-card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { Report, ReportService } from "@/services/report-service";

const mapCallStatusToReportStatus = (status: string): ReportStatus => {
  switch (status) {
    case 'dispatched':
      return 'dispatched';
    case 'disconnected':
      return 'disconnected';
    case 'finished':
    case 'ended': // Map 'ended' status to 'finished' to show "Selesai"
      return 'finished';
    default:
      return 'disconnected';
  }
};

export default function ReportList() {
  const { session } = useAuth();
  const { data: reports, loading, error } = useSupabaseQuery<Report[]>(
    () => ReportService.getOperatorReports(session?.user?.id ?? ''),
    [session],
    { enabled: !!session?.user.id }
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        {loading ? (
          <Label type="defaultMuted" className="text-center w-full block">Memuat laporan...</Label>
        ) : error ? (
          <Label type="defaultMuted" className="text-center w-full block text-red-500">Error: Gagal memuat laporan.</Label>
        ) : reports && reports.length > 0 ? (
          reports.map((report) => (
            <ReportCard
              key={report.id}
              id={report.id}
              timestamp={new Date(report.call.started_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              reportType={report.operator_report.report_type}
              eventType={report.operator_report.event_type}
              reportStatus={mapCallStatusToReportStatus(report.call.status)}
            />
          ))
        ) : (
          <Label type="defaultMuted" className="text-center w-full block">Belum ada laporan untuk Anda.</Label>
        )}
      </div>
    </div>
  )
}
