"use client";

import ReportList from "@/components/pages/dashboard/report-list";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/form/select-field";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";

export default function LaporanPage() {
  const [filters, setFilters] = useState({
    tanggal: "",
    jenisLaporan: "",
    tipeKejadian: "",
    statusLaporan: ""
  });

  const [appliedFilters, setAppliedFilters] = useState({
    tanggal: "",
    jenisLaporan: "",
    tipeKejadian: "",
    statusLaporan: ""
  });

  const jenisLaporanOptions = [
    { value: "darurat", label: "Darurat" },
    { value: "non-darurat", label: "Non-darurat" },
    { value: "informasi", label: "Informasi" },
    { value: "prank", label: "Prank (palsu)" },
    { value: "ghost", label: "Ghost (terputus/tidak jelas)" },
  ];

  const tipeKejadianOptions = [
    { value: "kecelakaan", label: "Kecelakaan Lalu Lintas" },
    { value: "kebakaran", label: "Kebakaran" },
    { value: "bencana alam", label: "Bencana Alam" },
    { value: "tindak kriminal", label: "Tindak Kriminal" },
    { value: "informasi umum", label: "Informasi Umum" },
  ];

  const statusLaporanOptions = [
    { value: "dispatched", label: "Diteruskan ke Dispatcher" },
    { value: "disconnected", label: "Telepon Terputus" },
    { value: "finished", label: "Selesai" },
  ];

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    // Apply the current filters
    setAppliedFilters(filters);
    console.log("Searching with filters:", filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      tanggal: "",
      jenisLaporan: "",
      tipeKejadian: "",
      statusLaporan: ""
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  return (
    <div className="flex w-full h-full flex-col">
      {/* Filter Section */}
      <div className="p-3 px-10">
        <div className="flex gap-4 items-center">
          {/* Tanggal */}
          <div className="flex-1">
            <Input
              type="date"
              placeholder="Tanggal"
              value={filters.tanggal}
              onChange={(e) => handleFilterChange('tanggal', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Jenis Laporan */}
          <div className="flex-1">
            <SelectField
              placeholder="Jenis Laporan"
              selectOptions={jenisLaporanOptions}
              value={filters.jenisLaporan}
              onValueChange={(value) => handleFilterChange('jenisLaporan', value)}
            />
          </div>

          {/* Tipe Kejadian */}
          <div className="flex-1">
            <SelectField
              placeholder="Tipe Kejadian"
              selectOptions={tipeKejadianOptions}
              value={filters.tipeKejadian}
              onValueChange={(value) => handleFilterChange('tipeKejadian', value)}
            />
          </div>

          {/* Status Laporan */}
          <div className="flex-1">
            <SelectField
              placeholder="Status Laporan"
              selectOptions={statusLaporanOptions}
              value={filters.statusLaporan}
              onValueChange={(value) => handleFilterChange('statusLaporan', value)}
            />
          </div>

          {/* Search Button */}
            <div className="flex-shrink-0 flex gap-2">
              <Button variant="outline" onClick={handleClearFilters} className="px-6">
                <Icon icon="material-symbols:clear-all" className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSearch} className="px-8 py-2">
                <Icon icon="material-symbols:search" className="w-4 h-4 mr-2" />
                Cari
              </Button>
            </div>
        </div>
      </div>

      {/* Report List */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-6">
            <ReportList filters={appliedFilters} />
          </div>
        </div>
      </div>
    </div>
  );
}
