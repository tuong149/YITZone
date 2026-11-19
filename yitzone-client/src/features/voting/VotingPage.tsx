import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VotingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Bình chọn Hội trường &amp; Live Voting LED</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bỏ phiếu Kín Outbox &amp; Bảng điểm Ban Giám khảo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Kết nối STOMP WebSocket (`/topic/voting.*`) cập nhật tiến độ cử tri theo thời gian thực và cấp biên nhận băm SHA-256.
        </CardContent>
      </Card>
    </div>
  );
}
