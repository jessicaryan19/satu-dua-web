"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import DataCard from "@/components/cards/data-card";
import IncomingCallCard from "@/components/cards/incoming-call-card";
import ReportCard, { ReportStatus } from "@/components/cards/report-card";
import { StatusSwitch } from "@/components/switches/status-switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react/dist/iconify.js";

import { supabase } from "@/lib/supabase";

type ReportRow = {
  id: string;
  created_at: string;
  ai_summary: string | null;
  call: {
    id: string;
    started_at: string;
    status: string;
    caller: { name: string };
    operator: { id: string; name: string };
  };
};

const mapCallStatusToReportStatus = (status: string): ReportStatus => {
  switch (status) {
    case 'dispatched':
    case 'disconnected':
    case 'finished':
      return status;
    default:
      return 'disconnected'; // fallback if unknown
  }
};


export default function Home() {
  const [isStatusActive, setIsStatusActive] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  // Fetch logged-in operator ID
  useEffect(() => {
    const fetchOperator = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      setOperatorId(sessionData.session.user.id);
    };
    fetchOperator();
  }, []);

  // Fetch reports for this operator
  useEffect(() => {
    if (!operatorId) return;

    const fetchReports = async () => {
      const { data, error } = await supabase
        .from("satudua.reports")
        .select(`
          id,
          created_at,
          ai_summary,
          call:call_id (
            id,
            started_at,
            status,
            caller:caller_id ( name ),
            operator:operator_id ( id, name )
          )
        `)
        .eq("call.operator_id", operatorId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching reports:", error);
        return;
      }
      setReports(data as unknown as ReportRow[]);
    };

    fetchReports();
  }, [operatorId]);

  return (
    <div className="flex w-full">
      {/* LEFT SIDE */}
      <div className="w-2/3 h-full py-4 flex flex-col gap-6">
        {/* Top status */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center justify-center">
            <Label type="subtitle">Status</Label>
            <StatusSwitch checked={isStatusActive} onCheckedChange={setIsStatusActive} />
          </div>
          <div className="flex gap-2 items-center justify-center">
            <Icon icon="bi:people-fill" className="text-primary" />
            <Label>15/20 operator bertugas</Label>
          </div>
        </div>

        {/* Data cards */}
        <div className="w-full flex gap-4">
          <DataCard title="Total Laporan Hari Ini" value={reports.length.toString()} icon="carbon:report" />
          <DataCard title="Total Antrian" value="127" icon="solar:incoming-call-bold" />
          <DataCard title="Waktu Respons" value="10 menit" icon="icon-park-solid:timer" theme="red" />
        </div>

        {/* Reports list */}
        <Label type="title" className="text-primary">Laporan Hari Ini</Label>
        <div className="w-full h-full flex flex-col gap-4">
          {reports.length > 0 ? (
            reports.map((report) => (
              <ReportCard
                key={report.id}
                id={report.id}
                timestamp={new Date(report.call.started_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                reportType="Darurat"
                eventType={report.ai_summary || "Tidak ada ringkasan"}
                reportStatus={mapCallStatusToReportStatus(report.call.status)}
              />
            ))
          ) : (
            <Label type="defaultMuted" className="text-center w-full block">Belum ada laporan untuk Anda.</Label>
          )}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative w-1/3 flex flex-col justify-center items-center flex-1 p-12 gap-6">
        <div className="absolute w-full h-full py-4 ps-4 z-100">
          <IncomingCallCard />
        </div>
        {isStatusActive ? (
          <>
            <div className="relative w-full h-1/2">
              <Image className="object-contain" src="/call-inactive.svg" alt="Tidak Tersedia" fill />
            </div>
            <div>
              <Label type="defaultMuted" className="text-center w-full block">Siap melayani?</Label>
              <Label type="defaultMuted" className="text-center w-full">Tekan tombol ini dan bantu warga yang membutuhkan.</Label>
            </div>
            <Button onClick={() => setIsStatusActive(!isStatusActive)}>Siap Bertugas</Button>
          </>
        ) : (
          <>
            <div className="relative w-full h-1/2">
              <Image className="object-contain" src="/call-active.svg" alt="Aktif" fill />
            </div>
            <div>
              <Label type="defaultMuted" className="text-center w-full block">Belum ada panggilan masuk.</Label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

