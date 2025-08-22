import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select } from "@radix-ui/react-select";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export default function ReportFormCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Label type="title">Laporan 25080600316</Label>
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="flex flex-col gap-4">
                    <Label type="subtitle">Data Pelapor</Label>
                    <div className="w-full flex gap-10">
                        <div className="w-1/2 flex">
                            <Label className="w-1/3">Nomor Telepon</Label>
                            <Input className="w-2/3" placeholder="Nomor telepon" />
                        </div>
                        <div className="w-1/2 flex">
                            <Label className="w-1/3">Nama</Label>
                            <Input className="w-2/3" placeholder="Nama" />
                        </div>
                    </div>

                    <Label type="subtitle">Data Laporan</Label>
                    <div className="w-full flex gap-10 ">
                        <div className="w-1/2 flex">
                            <Label className="w-1/3">Jenis Laporan</Label>
                            <Select>
                                <SelectTrigger className="w-2/3">
                                    <SelectValue placeholder="Theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-1/2 flex">
                            <Label className="w-1/3">Tipe Kejadian</Label>
                            <Select>
                                <SelectTrigger className="w-2/3">
                                    <SelectValue placeholder="Theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="w-full flex gap-10 ">
                        <div className="w-1/2 flex">
                            <Label className="w-1/3">Kecamatan</Label>
                            <Select>
                                <SelectTrigger className="w-2/3">
                                    <SelectValue placeholder="Theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-1/2 flex">
                            <Label className="w-1/3">Kelurahan</Label>
                            <Select>
                                <SelectTrigger className="w-2/3">
                                    <SelectValue placeholder="Theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="w-full flex gap-10 ">
                        <Label className="w-1/6">Detail Alamat</Label>
                        <Textarea placeholder="Detail Alamat" />
                    </div>

                    <Label type="subtitle">Data Kejadian</Label>
                    <Textarea placeholder="Detail Kejadian" />
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
        </Card >
    )
}