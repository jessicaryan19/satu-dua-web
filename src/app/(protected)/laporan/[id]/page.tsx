"use client";

import ReportDetailCard from "@/components/cards/report-detail-card";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { Report, ReportService } from "@/services/report-service";
import { useParams } from "next/navigation";
import React from "react";

export default function ReportDetailPage() {
    const { id } = useParams()
    const { data: report, loading, error } = useSupabaseQuery<Report>(
        () => ReportService.getReportDetails(id[0])
    );
    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString);

        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    function toTitleCase(str: string): string {
        return str
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    return (
        <div className="ps-4 h-full xl:w-3/4">
            {!loading &&
                <ReportDetailCard
                    id={report.id}
                    callerPhone={report.call.caller.phone_number ?? 'Tidak Diketahui'}
                    callerName={toTitleCase(report.call.caller.name) ?? 'Tidak Diketahui'}
                    locationDetail={report.operator_report.detail_address ?? 'Tidak Diketahui'}
                    timestamp={formatTimestamp(report.call.started_at)}
                    reportType={report.operator_report.report_type}
                    eventType={report.operator_report.event_type}
                    incidentDetails={report.operator_report.incident_details}
                    kecamatan={report.operator_report.kecamatan}
                    kelurahan={report.operator_report.kelurahan}
                    aiSummary={report.ai_summary}
                />}
        </div>
    );
}