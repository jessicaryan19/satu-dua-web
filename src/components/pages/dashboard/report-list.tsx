import ReportCard, { ReportStatus } from "@/components/cards/report-card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { Report, ReportService } from "@/services/report-service";
import { useMemo } from "react";

interface FilterOptions {
  tanggal: string;
  jenisLaporan: string;
  tipeKejadian: string;
  statusLaporan: string;
}

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

export default function ReportList({ 
  compact = false, 
  filters 
}: { 
  compact?: boolean;
  filters?: FilterOptions;
}) {
  const { session } = useAuth();
  const { data: reports, loading, error } = useSupabaseQuery<Report[]>(
    () => ReportService.getOperatorReports(session?.user?.id ?? ''),
    [session],
    { enabled: !!session?.user.id }
  );

  // Filter reports based on applied filters
  const filteredReports = useMemo(() => {
    if (!reports || !filters) return reports || [];

    return reports.filter((report) => {
      // Date filter
      if (filters.tanggal) {
        const reportDate = new Date(report.call.started_at).toISOString().split('T')[0];
        if (reportDate !== filters.tanggal) return false;
      }

      // Jenis Laporan filter
      if (filters.jenisLaporan && report.operator_report.report_type !== filters.jenisLaporan) {
        return false;
      }

      // Tipe Kejadian filter
      if (filters.tipeKejadian && report.operator_report.event_type !== filters.tipeKejadian) {
        return false;
      }

      // Status Laporan filter
      if (filters.statusLaporan) {
        const mappedStatus = mapCallStatusToReportStatus(report.call.status);
        if (mappedStatus !== filters.statusLaporan) return false;
      }

      return true;
    });
  }, [reports, filters]);

  // Format timestamp based on compact mode
  const formatTimestamp = (dateString: string, isCompact: boolean) => {
    const date = new Date(dateString);
    
    if (isCompact) {
      // For compact mode: just time (e.g., "13:26")
      return date.toLocaleTimeString("id-ID", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } else {
      // For full mode: full datetime (e.g., "22 Agustus 2025, 13:26")
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  };
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        {loading ? (
          <Label type="defaultMuted" className="text-center w-full block">Memuat laporan...</Label>
        ) : error ? (
          <Label type="defaultMuted" className="text-center w-full block text-red-500">Error: Gagal memuat laporan.</Label>
        ) : filteredReports && filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              id={report.id}
              callerName={report.call.caller.name ?? 'Tidak Diketahui'}
              locationDetail={report.call.location.detail_address ?? 'Tidak Diketahui'}
              timestamp={formatTimestamp(report.call.started_at, compact)}
              reportType={report.operator_report.report_type}
              eventType={report.operator_report.event_type}
              reportStatus={mapCallStatusToReportStatus(report.call.status)}
              compact={compact}
            />
          ))
        ) : (
          <Label type="defaultMuted" className="text-center w-full block">
            {filters && (filters.tanggal || filters.jenisLaporan || filters.tipeKejadian || filters.statusLaporan) 
              ? "Tidak ada laporan yang sesuai dengan filter yang dipilih."
              : "Belum ada laporan untuk Anda."}
          </Label>
        )}
      </div>
    </div>
  )
}
