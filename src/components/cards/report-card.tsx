import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "../ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { ChevronRight } from "lucide-react";
import { Badge, BadgeVariantType } from "../ui/badge";

export type ReportStatus = 'dispatched' | 'disconnected' | 'finished'
type ReportCardProps = {
  id: string,
  timestamp: string,
  callerName: string,
  locationDetail: string,
  reportType: string,
  eventType: string,
  reportStatus: ReportStatus,
  compact?: boolean // For smaller form in root page
}

export default function ReportCard({
  id,
  timestamp,
  callerName,
  locationDetail,
  reportType,
  eventType,
  reportStatus,
  compact = false
}: ReportCardProps) {

  const badge: Record<ReportStatus, { variant: BadgeVariantType, text: string }> = {
    dispatched: {
      variant: "default",
      text: "Diteruskan ke Dispatcher"
    },
    disconnected: {
      variant: "destructive",
      text: "Telepon Terputus"
    },
    finished: {
      variant: "success",
      text: "Selesai"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Label type="subtitle">{id}</Label>
        </CardTitle>
        <CardAction >
          <Label className="w-full" type="defaultMuted">{timestamp}</Label>
        </CardAction>
      </CardHeader>
      <CardContent className="flex justify-between">
        <div className="w-1/3 flex flex-col gap-2">
          {!compact && (
            <div className="flex w-full ">
              <Label className="w-1/2" type="defaultMuted">Nama Pelapor</Label>
              <Label className="w-1/2">{callerName}</Label>
            </div>
          )}
          <div className="flex w-full">
            <Label className="w-1/2" type="defaultMuted">Jenis Laporan</Label>
            <Label className="w-1/2">{reportType}</Label>
          </div>
          <div className="flex w-full">
            <Label className="w-1/2" type="defaultMuted">Tipe Kejadian</Label>
            <Label className="w-1/2">{eventType}</Label>
          </div>
        </div>

        <div className="w-2/3 flex flex-col gap-2">
          <div className="flex w-full">
            <Label className="w-1/4" type="defaultMuted">Status Laporan</Label>
            <Badge variant={badge[reportStatus].variant}>{badge[reportStatus].text}</Badge>
          </div>
          {!compact && (
            <>
              <div className="hidden xl:flex w-full">
                <Label className="w-1/4" type="defaultMuted">Detail Alamat</Label>
                <Label className="w-3/4">{locationDetail}</Label>
              </div>
            </>
          )}
        </div>
        <div className="w-1/6 flex items-end justify-end">
          {reportStatus === 'disconnected' ? (
            <Button variant="success">
              <Icon icon="ion:call" />
              Hubungi Ulang
            </Button>
          ) : (
            <Button variant="outline">
              Lihat Detail
              <ChevronRight />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
