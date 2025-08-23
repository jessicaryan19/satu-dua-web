import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { SelectField } from "../form/select-field";

export default function ReportFormCard() {
    const reportTypeOptions: string[] = ["Darurat", "Non-darurat", "Informasi", "Prank (palsu)", "Ghost (terputus/tidak jelas)"]
    const eventTypeOptions: string[] = ["Kecelakaan Lalu Lintas", "Kebakaran", "Bencana Alam", "Tindak Kriminal", "Informasi Umum"]

    // ini nanti fetch berdasarkan sent location
    const kecamatanOptions: string[] = []
    const kelurahanOptions: string[] = []

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
                                <Input className="col-span-2" placeholder="Nomor telepon" />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <Label className="col-span-1">Nama</Label>
                                <Input className="col-span-2" placeholder="Nama" />
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
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <Label className="col-span-1">Tipe Kejadian</Label>
                                <div className="col-span-2">
                                    <SelectField
                                        placeholder="Pilih"
                                        selectOptions={eventTypeOptions}
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
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <Label className="col-span-1">Kelurahan</Label>
                                <div className="col-span-2">
                                    <SelectField
                                        placeholder="Pilih"
                                        selectOptions={kelurahanOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-6 items-start gap-2 mt-4">
                            <Label className="col-span-1">Detail Alamat</Label>
                            <Textarea className="col-span-5 resize-none" placeholder="Detail Alamat" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 flex-1">
                        <Label type="subtitle">Data Kejadian</Label>
                        <Textarea className="flex-1 resize-none" placeholder="Detail Kejadian" />
                    </div>
                </div>
            </CardContent>

            <CardFooter>
                <div className="flex gap-4">
                    <Button variant="success">
                        <Icon icon="ion:call" />
                        Hubungi Dispatcher
                    </Button>
                    <Button variant="default">
                        <Icon icon="teenyicons:send-up-outline" />
                        Simpan Laporan
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}