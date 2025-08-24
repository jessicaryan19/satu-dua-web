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
    id: string,
    kecamatan: string,
    kelurahan: string,
    callerPhone: string,
    callerName: string,
    locationDetail: string,
    timestamp: string,
    reportType: string,
    eventType: string,
    reportStatus: string,
    compact: string,
    incidentDetails: string,
    aiSummary: string
}

export default function ReportDetailCard({
    id,
    callerPhone,
    callerName,
    kecamatan,
    kelurahan,
    locationDetail,
    timestamp,
    reportType,
    eventType,
    incidentDetails,
    aiSummary,
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

    return (
        <Card className="flex-1 flex flex-col gap-12">
            <CardHeader>
                <CardTitle>
                    <Label type="title">{id}</Label>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
                <div className="flex flex-col gap-8 flex-1">
                    <div>
                        <Label type="subtitle">Data Pelapor</Label>
                        <div className="grid grid-cols-2 gap-6 mt-4">
                            <div className="grid grid-cols-3 items-center gap-2">
                                <Label className="col-span-1">Nomor Telepon</Label>
                                <Input disabled
                                    className="col-span-2"
                                    placeholder="Nomor telepon"
                                    value={callerPhone}
                                />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <Label className="col-span-1">Nama</Label>
                                <Input disabled
                                    className="col-span-2"
                                    placeholder="Nama"
                                    value={callerName}
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
                                    <SelectField disabled={true}
                                        placeholder="Pilih"
                                        selectOptions={reportTypeOptions}
                                        value={reportType}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <Label className="col-span-1">Tipe Kejadian</Label>
                                <div className="col-span-2">
                                    <SelectField disabled={true}
                                        placeholder="Pilih"
                                        selectOptions={eventTypeOptions}
                                        value={eventType}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-4">
                            <div className="grid grid-cols-3 items-center gap-2">
                                <Label className="col-span-1">Kecamatan</Label>
                                <div className="col-span-2">
                                    <Input disabled
                                        className="col-span-2"
                                        placeholder="Nama"
                                        value={kecamatan}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <Label className="col-span-1">Kelurahan</Label>
                                <div className="col-span-2">
                                    <SelectField disabled={true}
                                        placeholder="Pilih"
                                        selectOptions={kelurahanOptions}
                                        value={kelurahan}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-6 items-start gap-2 mt-4">
                            <Label className="col-span-1">Detail Alamat</Label>
                            <Textarea
                                disabled
                                className="col-span-5 resize-none"
                                placeholder="Detail Alamat"
                                value={locationDetail}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 flex-1">
                        <Label type="subtitle">Data Kejadian</Label>
                        <Textarea
                            disabled
                            className="flex-1 resize-none"
                            placeholder="Detail Kejadian"
                            value={incidentDetails}
                        />
                    </div>

                    <div className="flex flex-col gap-4 flex-1">
                        <Label type="subtitle">AI Summary</Label>
                        <Textarea
                            disabled
                            className="flex-1 resize-none"
                            placeholder="Detail Kejadian"
                            value={aiSummary}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
