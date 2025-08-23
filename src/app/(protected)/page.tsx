"use client";
import { useState } from "react";
import Image from "next/image";
import DataCard from "@/components/cards/data-card";
import IncomingCallCard from "@/components/cards/incoming-call-card";
import { StatusSwitch } from "@/components/switches/status-switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react/dist/iconify.js";import ReportList from "@/components/pages/dashboard/report-list";
import DashboardDataCard from "@/components/pages/dashboard/dashboard-data-cards";

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

        <DashboardDataCard/>
        
        <Label type="title" className="text-primary px-4">Laporan Hari Ini</Label>
        <ReportList/>
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