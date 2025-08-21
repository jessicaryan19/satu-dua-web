import DataCard from "@/components/cards/data-card";
import ReportCard from "@/components/cards/report-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@iconify/react/dist/iconify.js";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex">
      <div className="w-2/3 h-full py-4 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center justify-center">
            <Label type="subtitle">Status</Label>
            <Switch>Test</Switch>
          </div>
          <div className="flex gap-2 items-center justify-center">
            <Icon icon="bi:people-fill" className="text-primary" />
            <Label>15/20 operator bertugas</Label>
          </div>
        </div>

        <div className="w-full flex gap-4">
          <DataCard title="Total Laporan Hari Ini" value="68" icon="carbon:report" />
          <DataCard title="Total Antrian" value="127" icon="solar:incoming-call-bold" />
          <DataCard title="Waktu Respons" value="10 menit" icon="icon-park-solid:timer" theme="red"/>
        </div>

        <Label type="title" className="text-primary">Laporan Hari Ini</Label>

        <div className="w-full flex flex-col gap-4">
          <ReportCard />
          <ReportCard />
          <ReportCard />
          <ReportCard />
        </div>
      </div>

      <div className="w-1/3 flex flex-col justify-center items-center flex-1 p-12 gap-6">
        <div className="relative w-full h-1/2">
          <Image
            className="object-contain"
            src="/call-inactive.svg"
            alt="Tidak Tersedia"
            fill
          />
        </div>

        <div>
          <Label type="defaultMuted" className="text-center w-full block">Siap melayani?</Label>
          <Label type="defaultMuted" className="text-center w-full">Tekan tombol ini dan bantu warga yang membutuhkan.</Label>
        </div>

        <Button>Siap Bertugas</Button>
      </div>

    </div>
  );
}
