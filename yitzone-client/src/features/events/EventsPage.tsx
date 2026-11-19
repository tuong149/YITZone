import { Calendar, QrCode, ShieldAlert } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvents } from "@/features/events/api";

export function EventsPage() {
  const { data: events = [], isLoading, isError } = useEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hoạt động &amp; Sự kiện Khoa CNTT</h1>
          <p className="text-sm text-muted-foreground">
            Cổng sự kiện Đoàn - Hội, điểm danh QR ký số ECDSA P-256 &amp; thẻ sinh viên vật lý 1D.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Danh sách Sự kiện từ Backend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Đang tải danh sách sự kiện...</p>}
            {isError && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Chưa kết nối được API `/api/v1/events`. Hãy khởi chạy `yitzone-server` (port 8080) để đồng bộ dữ liệu thực tế.
                </span>
              </div>
            )}
            {!isLoading && !isError && events.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Hệ thống sẵn sàng. Chưa có sự kiện nào trong MongoDB `EVENTS`.
              </p>
            )}
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{event.title}</h4>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                      {event.visibility}
                    </span>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              Vé QR Ngoại tuyến (Bucket 15s)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-lg border border-border bg-white p-3">
              <QRCodeSVG value="YITZONE-ECDSA-P256-DEMO-TICKET" size={140} />
            </div>
            <p className="text-xs text-muted-foreground">
              Khóa riêng ECDSA P-256 (`extractable: false`) được giữ trong IndexedDB trên thiết bị sinh viên.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
