"use client";
import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField, SelectOption } from '@/components/form/select-field';
import { ReportService, ReportFormData } from "@/services/report-service";
import { toast } from "sonner";

interface ReportFormCardProps {
  aiAnalysis?: string;
  aiRecommendation?: string;
  operatorId: string; // This should be passed from your auth context/session
}

export default function ReportFormCard({
  aiAnalysis,
  aiRecommendation,
  operatorId
}: ReportFormCardProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    callerPhone: "",
    callerName: "",
    reportType: "",
    eventType: "",
    kecamatan: "",
    kelurahan: "",
    detailAddress: "",
    incidentDetails: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  const reportTypeOptions: SelectOption[] = [
    { value: "darurat", label: "Darurat" },
    { value: "non-darurat", label: "Non-darurat" },
    { value: "informasi", label: "Informasi" },
    { value: "prank", label: "Prank (palsu)" },
    { value: "ghost", label: "Ghost (terputus/tidak jelas)" },
  ];

  const eventTypeOptions: SelectOption[] = [
    { value: "kecelakaan", label: "Kecelakaan Lalu Lintas" },
    { value: "kebakaran", label: "Kebakaran" }, // Fixed typo from "kebakaranb"
    { value: "bencana alam", label: "Bencana Alam" },
    { value: "tindak kriminal", label: "Tindak Kriminal" },
    { value: "informasi umum", label: "Informasi Umum" },
  ];

  // ini nanti fetch berdasarkan sent location
  const kecamatanOptions: SelectOption[] = [
    // Add your kecamatan options here
    { value: "kecamatan1", label: "Kecamatan 1" },
    { value: "kecamatan2", label: "Kecamatan 2" },
  ];

  const kelurahanOptions: SelectOption[] = [
    // Add your kelurahan options here based on selected kecamatan
    { value: "kelurahan1", label: "Kelurahan 1" },
    { value: "kelurahan2", label: "Kelurahan 2" },
  ];

  const handleInputChange = (field: keyof ReportFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectChange = (field: keyof ReportFormData) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleSaveReport = async () => {
    console.log("Saving report with data:", formData, operatorId, aiAnalysis, aiRecommendation);

    setIsLoading(true);
    try {
      const result = await ReportService.saveReport(
        formData,
        operatorId,
        aiAnalysis,
        aiRecommendation
      );

      if (result.success) {
        toast.success(`Laporan berhasil disimpan dengan ID: ${result.reportId}`);
        // Optionally reset form or redirect
        // setFormData({ ... empty form data ... });
      } else {
        toast.error(`Gagal menyimpan laporan: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error("Terjadi kesalahan saat menyimpan laporan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallDispatcher = () => {
    // Implement call dispatcher functionality
    toast.info("Menghubungi dispatcher...");
  };

  return (
    <Card className="flex-1 flex flex-col gap-12">
      <CardHeader>
        <CardTitle>
          <Label type="title">Laporan 25080600316</Label>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="flex flex-col gap-8 flex-1">
          <div>
            <Label type="subtitle">Data Pelapor</Label>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="col-span-1">Nomor Telepon</Label>
                <Input
                  className="col-span-2"
                  placeholder="Nomor telepon"
                  value={formData.callerPhone}
                  onChange={(e) => handleInputChange('callerPhone', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="col-span-1">Nama</Label>
                <Input
                  className="col-span-2"
                  placeholder="Nama"
                  value={formData.callerName}
                  onChange={(e) => handleInputChange('callerName', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label type="subtitle">Data Laporan</Label>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="col-span-1">Jenis Laporan</Label>
                <div className="col-span-2">
                  <SelectField
                    placeholder="Pilih"
                    selectOptions={reportTypeOptions}
                    value={formData.reportType}
                    onValueChange={handleSelectChange('reportType')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="col-span-1">Tipe Kejadian</Label>
                <div className="col-span-2">
                  <SelectField
                    placeholder="Pilih"
                    selectOptions={eventTypeOptions}
                    value={formData.eventType}
                    onValueChange={handleSelectChange('eventType')}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="col-span-1">Kecamatan</Label>
                <div className="col-span-2">
                  <SelectField
                    placeholder="Pilih"
                    selectOptions={kecamatanOptions}
                    value={formData.kecamatan}
                    onValueChange={handleSelectChange('kecamatan')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="col-span-1">Kelurahan</Label>
                <div className="col-span-2">
                  <SelectField
                    placeholder="Pilih"
                    selectOptions={kelurahanOptions}
                    value={formData.kelurahan}
                    onValueChange={handleSelectChange('kelurahan')}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 items-start gap-2 mt-4">
              <Label className="col-span-1">Detail Alamat</Label>
              <Textarea
                className="col-span-5 resize-none"
                placeholder="Detail Alamat"
                value={formData.detailAddress}
                onChange={(e) => handleInputChange('detailAddress', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <Label type="subtitle">Data Kejadian</Label>
            <Textarea
              className="flex-1 resize-none"
              placeholder="Detail Kejadian"
              value={formData.incidentDetails}
              onChange={(e) => handleInputChange('incidentDetails', e.target.value)}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex gap-4">
          <Button
            variant="success"
            onClick={handleCallDispatcher}
            disabled={isLoading}
          >
            <Icon icon="ion:call" />
            Hubungi Dispatcher
          </Button>
          <Button
            variant="default"
            onClick={handleSaveReport}
            disabled={isLoading}
          >
            <Icon icon="teenyicons:send-up-outline" />
            {isLoading ? "Menyimpan..." : "Simpan Laporan"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
