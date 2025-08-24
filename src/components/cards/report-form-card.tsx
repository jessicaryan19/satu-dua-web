"use client";
import { useState, useEffect } from "react";
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
  callId: string; // The Agora channelName/call ID
  aiAnalysis?: string;
  aiRecommendation?: string;
  operatorId: string; // This should be passed from your auth context/session
  onReportSaved?: () => void; // Callback when report is successfully saved
  callEnded?: boolean; // Whether the call has ended
}

export default function ReportFormCard({
  callId,
  aiAnalysis,
  aiRecommendation,
  operatorId,
  onReportSaved,
  callEnded = false
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
  const [loadingCallDetails, setLoadingCallDetails] = useState(false);

  // Load call details and pre-populate form with existing data
  useEffect(() => {
    const loadCallDetails = async () => {
      if (!callId) return;

      setLoadingCallDetails(true);
      try {
        const result = await ReportService.getCallDetails(callId);
        
        if (result.success && result.data) {
          const callData = result.data;
          const caller = Array.isArray(callData.caller) ? callData.caller[0] : callData.caller;
          
          console.log("Call data received:", callData);
          console.log("Location data:", callData.location);
          
          // Pre-populate form with call data if available
          setFormData(prev => ({
            ...prev,
            callerPhone: caller?.phone_number || prev.callerPhone,
            callerName: caller?.name || prev.callerName,
            kecamatan: callData.location?.kecamatan || prev.kecamatan,
            kelurahan: callData.location?.kelurahan || prev.kelurahan,
            detailAddress: callData.location?.detail_address || caller?.address || prev.detailAddress
          }));
          
          console.log("Pre-populated form with call data:", {
            caller: caller,
            location: callData.location,
            formData: {
              kecamatan: callData.location?.kecamatan,
              kelurahan: callData.location?.kelurahan,
              detailAddress: callData.location?.detail_address || caller?.address
            }
          });
        } else {
          console.warn("Could not load call details:", result.error);
        }
      } catch (error) {
        console.error("Error loading call details:", error);
      } finally {
        setLoadingCallDetails(false);
      }
    };

    loadCallDetails();
  }, [callId]);

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
    // Add actual kecamatan options - these should match what's in your database
    { value: "kecamatan1", label: "Kecamatan 1" },
    { value: "kecamatan2", label: "Kecamatan 2" },
    // Add any kecamatan value from the call data if it's not in the list
    ...(formData.kecamatan && !["kecamatan1", "kecamatan2"].includes(formData.kecamatan) 
        ? [{ value: formData.kecamatan, label: formData.kecamatan }] 
        : [])
  ];

  const kelurahanOptions: SelectOption[] = [
    // Add actual kelurahan options based on selected kecamatan - these should match what's in your database
    { value: "kelurahan1", label: "Kelurahan 1" },
    { value: "kelurahan2", label: "Kelurahan 2" },
    // Add any kelurahan value from the call data if it's not in the list
    ...(formData.kelurahan && !["kelurahan1", "kelurahan2"].includes(formData.kelurahan) 
        ? [{ value: formData.kelurahan, label: formData.kelurahan }] 
        : [])
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
        callId,
        formData,
        operatorId,
        aiAnalysis,
        aiRecommendation
      );

      if (result.success) {
        toast.success(`Laporan berhasil disimpan dengan ID: ${result.reportId}`);
        // Call the callback to notify parent that report has been saved
        if (onReportSaved) {
          onReportSaved();
        }
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
          <Label type="title">Laporan {callId}</Label>
          {callEnded && (
            <div className="mt-2 text-sm text-red-600 font-medium">
              ⚠️ Call ended - Report must be completed before leaving
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {loadingCallDetails ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading call details...</p>
            </div>
          </div>
        ) : (
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
        )}
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
            className={callEnded ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Icon icon="teenyicons:send-up-outline" />
            {isLoading ? "Menyimpan..." : callEnded ? "Complete Report & Return to Dashboard" : "Simpan Laporan"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
