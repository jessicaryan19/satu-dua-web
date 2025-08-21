import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "../ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";

export default function ReportCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Label type="subtitle">ID 2507202100025</Label>
                </CardTitle>
                <CardAction>
                    <Label className="w-1/2" type="defaultMuted">13:26</Label>
                </CardAction>
            </CardHeader>
            <CardContent className="flex justify-between">
                <div className="w-1/3 flex flex-col gap-2">
                    <div className="flex w-full">
                        <Label className="w-1/2" type="defaultMuted">Jenis Laporan</Label>
                        <Label className="w-1/2">Darurat</Label>
                    </div>
                    <div className="flex w-full">
                        <Label className="w-1/2" type="defaultMuted">Tipe Kejadian</Label>
                        <Label className="w-1/2">Kriminalitas</Label>
                    </div>
                </div>

                <div className="w-1/3 flex flex-col gap-2">
                    <div className="flex w-full">
                        <Label className="w-1/2" type="defaultMuted">Status Laporan</Label>
                        <Badge variant={"secondary"}>Telepon Terputus</Badge>
                    </div>
                </div>
                <div className="flex items-end">
                    <Button variant="outline">
                        Lihat Detail
                        <ChevronRight/>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}