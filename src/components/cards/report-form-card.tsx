import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export default function ReportFormCard() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>
                    <Label type="title">Laporan 25080600316</Label>
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div>
                    <Label type="subtitle">Data Pelapor</Label>
                    <div className="w-full flex gap-10">
                        <div className="w-1/2 flex gap-4">
                            <Label>Nomor Telepon</Label>
                            <Input placeholder="Nomor telepon" />
                        </div>
                        <div className="w-1/2 flex gap-4">
                            <Label >Nama</Label>
                            <Input placeholder="Nama" />
                        </div>
                    </div>

                    <Label type="subtitle">Data Laporan</Label>
                    <div className="w-full flex gap-10 ">
                        <div className="w-1/2 flex gap-4">
                            <Label>Jenis Laporan</Label>
                            <Input placeholder="Nomor telepon" />
                        </div>
                        <div className="w-1/2 flex gap-4">
                            <Label >Tipe Kejadian</Label>
                            <Input placeholder="Nama" />
                        </div>
                    </div>

                    <div className="w-full flex gap-10 ">
                        <div className="w-1/2 flex gap-4">
                            <Label>Kecamatan</Label>
                            <Input placeholder="Nomor telepon" />
                        </div>
                        <div className="w-1/2 flex gap-4">
                            <Label >Kelurahan</Label>
                            <Input placeholder="Nama" />
                        </div>
                    </div>

                    <div className="w-full flex gap-10 ">

                        <Label>Detail Alamat</Label>
                        <Textarea placeholder="Detail Alamat" />
                    </div>

                    <Label type="subtitle">Data Kejadian</Label>
                    <Textarea placeholder="Detail Kejadian" />
                    
                    <div className="flex gap-4">
                        <Button variant="success">
                            <Icon icon="ion:call"/>
                            Hubungi Dispatcher
                        </Button>
                        <Button variant="default">
                            <Icon icon="teenyicons:send-up-outline"/>
                            Simpan Laporan
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card >
    )
}