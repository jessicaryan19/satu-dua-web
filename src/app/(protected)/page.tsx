"use client"
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DataCard from "@/components/cards/data-card";
import IncomingCallCard from "@/components/cards/incoming-call-card";
import ReportCard from "@/components/cards/report-card";
import { StatusSwitch } from "@/components/switches/status-switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react/dist/iconify.js";

import { supabase } from "@/lib/supabase";

export default function Home() {
  const [isStatusActive, setIsStatusActive] = useState(false);

  return (
    <div className="flex h-full gap-4">
      <div className="w-2/3 flex flex-col gap-4 h-full">
        <div className="flex justify-between items-center px-4">
          <div className="flex gap-4 items-center">
            <Label type="subtitle">Status</Label>
            <StatusSwitch checked={isStatusActive} onCheckedChange={setIsStatusActive} />
          </div>
          <div className="flex gap-2 items-center">
            <Icon icon="bi:people-fill" className="text-primary" />
            <Label>15/20 operator bertugas</Label>
          </div>
        </div>

        <div className="w-full flex gap-4 px-4 pb-4">
          <DataCard title="Total Laporan Hari Ini" value="68" icon="carbon:report" />
          <DataCard title="Total Antrian" value="127" icon="solar:incoming-call-bold" />
          <DataCard title="Waktu Respons" value="10 menit" icon="icon-park-solid:timer" theme="red" />
        </div>

        <Label type="title" className="text-primary px-4">Laporan Hari Ini</Label>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4">
            <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="finished" />
            <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="disconnected" />
            <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="dispatched" />
            <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="dispatched" />
            <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="dispatched" />
            <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="dispatched" />
          </div>
        </div>
      </div>

      <div className="relative w-1/3 flex flex-col justify-center items-center p-12 gap-6 h-full">
        <div className="absolute w-full h-full z-100">
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
