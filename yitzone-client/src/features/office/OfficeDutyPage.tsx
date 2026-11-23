import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MapPin,
  ShoppingBag,
  Sparkles,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CLEANING_CHECKLIST = [
  "Lau sạch bàn trực, quầy tiếp nhận hồ sơ và bàn họp",
  "Sắp xếp gọn tài liệu, thùng áo Khoa và tủ thiết bị OFIT",
  "Thu gom rác, thay túi rác mới tại góc văn phòng",
  "Kiểm tra tắt điều hòa, quạt, đèn và rút ổ cắm thừa",
  "Khóa cửa văn phòng A1-204 & bàn giao chìa khóa đúng quy định"
];

interface ShiftSlot {
  id: string;
  day: string;
  shiftName: string;
  time: string;
  registered: number;
  capacity: number;
  mine: boolean;
  conflict?: string;
}

const INITIAL_SLOTS: ShiftSlot[] = [
  { id: "s-t2-1", day: "Thứ 2", shiftName: "Ca 1", time: "07:30–09:30", registered: 2, capacity: 3, mine: true },
  { id: "s-t3-2", day: "Thứ 3", shiftName: "Ca 2", time: "09:30–11:30", registered: 3, capacity: 3, mine: false },
  {
    id: "s-t4-4",
    day: "Thứ 4",
    shiftName: "Ca 4",
    time: "13:00–15:00",
    registered: 1,
    capacity: 3,
    mine: false,
    conflict: "Trùng Vòng loại Trắc nghiệm (14:00–15:00)"
  },
  { id: "s-t5-3", day: "Thứ 5", shiftName: "Ca 3", time: "10:00–12:00", registered: 2, capacity: 3, mine: false },
  {
    id: "s-t6-clean",
    day: "Thứ 6",
    shiftName: "Ca Vệ sinh T6",
    time: "16:50–17:30",
    registered: 2,
    capacity: 4,
    mine: true
  },
  { id: "s-t7-2", day: "Thứ 7", shiftName: "Ca 2", time: "09:30–11:30", registered: 1, capacity: 3, mine: false }
];

interface SwapRequest {
  id: string;
  fromName: string;
  fromMssv: string;
  shiftLabel: string;
  reason: string;
  hoursBefore: number;
  status: "WAITING_PEER" | "AUTO_APPROVED" | "PENDING_OFIT";
}

const INITIAL_SWAPS: SwapRequest[] = [
  {
    id: "sw-1",
    fromName: "Nguyễn Hoàng Nam",
    fromMssv: "23110218",
    shiftLabel: "Thứ 5 · Ca 3 (10:00–12:00)",
    reason: "Bận lịch thí nghiệm Mạng máy tính đột xuất",
    hoursBefore: 36,
    status: "WAITING_PEER"
  }
];

export function OfficeDutyPage(){
  const [checkInState, setCheckInState] = useState<"IDLE" | "ON_TIME" | "LATE" | "CHECKED_OUT">("IDLE");
  const [gpsDistance] = useState<number>(18); // meters (warning > 30m)
  const [checkedItems, setCheckedItems] = useState<boolean[]>(CLEANING_CHECKLIST.map(() => false));
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [logNote, setLogNote] = useState("");
  const [slots, setSlots] = useState<ShiftSlot[]>(INITIAL_SLOTS);
  const [swaps, setSwaps] = useState<SwapRequest[]>(INITIAL_SWAPS);

  // Absence & makeup state (UC-DUTY-03)
  const [absenceMode, setAbsenceMode] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [makeupShift, setMakeupShift] = useState("s-t5-3");
  const [absenceReason, setAbsenceReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const completedChecklist = checkedItems.filter(Boolean).length;
  const canCheckOut = checkInState === "ON_TIME" || checkInState === "LATE";

  const handleCheckIn = (simulatedMinutesLate: number) => {
    if (simulatedMinutesLate <= 15) {
      setCheckInState("ON_TIME");
      setNotice(
        "Check-in Đúng giờ thành công! Hệ thống đã tự động mở tạm quyền phát vật phẩm tại bàn trực."
      );
    } else {
      setCheckInState("LATE");
      setNotice(
        "Check-in ghi nhận Đi trễ (phút 16–30) và đã gửi cảnh báo tới Ban OFIT. Tạm quyền bàn phát vật phẩm vẫn được mở."
      );
    }
  };

  const handleToggleSlot = (slot: ShiftSlot) => {
    if (slot.conflict && !slot.mine) {
      setNotice(`Không thể đăng ký ${slot.day} · ${slot.shiftName}: ${slot.conflict}.`);
      return;
    }
    if (slot.registered >= slot.capacity && !slot.mine) return;
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id
          ? {...s, mine: !s.mine, registered: s.mine ? s.registered - 1: s.registered + 1 }
: s
      )
    );
  };

  const handleSubmitAbsence = () => {
    if (absenceReason.trim().length < 6) {
      setNotice("Vui lòng nhập lý do xin vắng tối thiểu 6 ký tự.");
      return;
    }
    if (absenceMode === "NORMAL") {
      setNotice(
        "Đơn xin vắng (≥ 2 giờ) + Ca bù hợp lệ đã được CHẤP NHẬN TỰ ĐỘNG và đồng bộ lại vào Lịch Của Tôi."
      );
    } else {
      setNotice(
        "Đơn ngoại lệ cận giờ (< 2 giờ) đã chuyển vào hàng chờ Trưởng/Phó Ban OFIT duyệt thủ công."
      );
    }
    setAbsenceReason("");
  };

  const handleAcceptSwap = (req: SwapRequest) => {
    const nextStatus = req.hoursBefore >= 24 ? "AUTO_APPROVED": "PENDING_OFIT";
    setSwaps((prev) => prev.map((s) => (s.id === req.id ? {...s, status: nextStatus }: s)));
    setNotice(
      nextStatus === "AUTO_APPROVED"
        ? `Bạn đã nhận ca ${req.shiftLabel}. Do gửi trước ≥ 24h, hệ thống tự động duyệt và chuyển trách nhiệm điểm danh sang bạn.`
: `Bạn đã xác nhận nhận ca ${req.shiftLabel}. Đơn đang chờ Ban OFIT phê duyệt.`
    );
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col gap-3 rounded-[26px] p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Trực Văn phòng Đoàn – Hội (OFIT)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Điểm danh đầu/cuối ca, hoàn thành Checklist Ca Vệ sinh T6, đăng ký ca trực &amp; đổi ca minh bạch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="calOffice" className="rounded-full px-3 py-1">
            Định mức tuần: 2 / 2 ca
          </Badge>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/calendar">Xem trên Lịch hoạt động</Link>
          </Button>
        </div>
      </section>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <span className="font-medium">{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-semibold text-primary underline underline-offset-2"
          >
            Đóng
          </button>
        </div>
      )}

      <Tabs defaultValue="checkin" className="space-y-5">
        <TabsList>
          <TabsTrigger value="checkin">Điểm danh &amp; Vệ sinh T6</TabsTrigger>
          <TabsTrigger value="register">Đăng ký Ca (6 ca + VS T6)</TabsTrigger>
          <TabsTrigger value="absence">Xin vắng / Ca bù &amp; Đổi ca</TabsTrigger>
        </TabsList>

        {/* Tab 1: Active Shift Check-in/out & Cleaning Checklist (UC-DUTY-02) */}
        <TabsContent value="checkin" className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Ca trực hiện tại: Thứ 6 · Ca Vệ sinh (16:50–17:30)</CardTitle>
                <Badge
                  variant={
                    checkInState === "ON_TIME" || checkInState === "CHECKED_OUT"
                      ? "success"
: checkInState === "LATE"
                        ? "warning"
: "calOffice"
                  }
                >
                  {checkInState === "IDLE"
                    ? "Chờ Check-in"
: checkInState === "ON_TIME"
                      ? "Đang trực · Đúng giờ"
: checkInState === "LATE"
                        ? "Đang trực · Đi trễ (16–30')"
: "Đã Check-out hoàn tất"}
                </Badge>
              </div>
              <CardDescription>
                Quy tắc điểm danh: ≤ 15 phút tính Đúng giờ; phút 16–30 tính Đi trễ (cảnh báo OFIT); quá 30 phút
                khóa ca tính Vắng không phép.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/35 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-brand-cyan" />
                    <span>Định vị GPS Văn phòng A1-204</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="tabular-mono text-sm font-semibold text-foreground">
                      Khoảng cách: {gpsDistance}m
                    </span>
                    <Badge variant="success">Trong bán kính 30m</Badge>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/35 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-cal-office" />
                    <span>Cửa sổ Check-out cuối ca</span>
                  </div>
                  <div className="tabular-mono mt-1 text-sm font-semibold text-foreground">
                    17:25 – 17:45 (-5&apos; / +15&apos;)
                  </div>
                </div>
              </div>

              {/* Temporary Store Booth Permission Banner */}
              {canCheckOut && (
                <div className="flex flex-col gap-3 rounded-lg border border-status-success/35 bg-status-success/10 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
                    <div className="text-xs">
                      <div className="font-semibold text-status-success">
                        Đã mở tạm quyền Bàn Phát vật phẩm trong ca trực
                      </div>
                      <p className="mt-0.5 text-muted-foreground">
                        Bạn có thể quét QR đơn hàng / mã vạch thẻ SV để giao vật phẩm Khoa ngay trong ca trực này.
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link to="/staff/store-booth">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Mở Bàn giao hàng</span>
                    </Link>
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                {checkInState === "IDLE" ? (
                  <>
                    <Button onClick={() => handleCheckIn(5)}>
                      <UserCheck className="h-4 w-4" />
                      <span>Check-in Đầu ca (Đúng giờ ≤ 15&apos;)</span>
                    </Button>
                    {import.meta.env.DEV && (
                      <Button variant="outline" onClick={() => handleCheckIn(22)}>
                        <span>Mô phỏng Check-in Trễ (phút 22)</span>
                      </Button>
                    )}
                  </>
                ): canCheckOut ? (
                  <Button
                    onClick={() => {
                      setCheckInState("CHECKED_OUT");
                      setNotice("Check-out cuối ca thành công! Nhật ký trực đã được lưu.");
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Check-out Cuối ca</span>
                  </Button>
                ): (
                  import.meta.env.DEV && (
                    <Button variant="outline" onClick={() => setCheckInState("IDLE")}>
                      Đặt lại trạng thái mô phỏng
                    </Button>
                  )
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="shift-log-note">Sổ Nhật ký Ca trực</Label>
                <Textarea
                  id="shift-log-note"
                  placeholder="Ghi nhận bàn giao hồ sơ, sinh viên đến liên hệ, hoặc thiết bị phát sinh trong ca..."
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Friday Cleaning 5-Item Checklist */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Checklist Ca Vệ sinh T6</CardTitle>
                <Badge variant={completedChecklist === 5 ? "success": "secondary"}>
                  {completedChecklist}/5 hạng mục
                </Badge>
              </div>
              <CardDescription>
                Bắt buộc hoàn thành 5 hạng mục và đính kèm ảnh hiện trạng trước khi Check-out.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {CLEANING_CHECKLIST.map((item, idx) => (
                  <label
                    key={item}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-sm transition-colors",
                      checkedItems[idx]
                        ? "border-status-success/35 bg-status-success/5 text-foreground"
: "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checkedItems[idx]}
                      onChange={() =>
                        setCheckedItems((prev) => prev.map((v, i) => (i === idx ? !v: v)))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="leading-snug">{item}</span>
                  </label>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/25 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {photoUploaded
                        ? "hien-trang-vp-t6-2111.jpg (Đã đính kèm)"
: "Chưa có ảnh hiện trạng sau vệ sinh"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPhotoUploaded((p) => !p)}
                  >
                    {photoUploaded ? "Đổi ảnh": "Tải ảnh mẫu"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Shift Registration Matrix (UC-DUTY-01) */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Đăng ký Đợt Trực Tuần 12 (23/11 – 28/11/2026)</CardTitle>
              <CardDescription>
                6 ca cố định (T2–T7) + Ca Vệ sinh T6 (16:50–17:30). Hệ thống tự động đối chiếu trùng giờ với Lịch
                Của Tôi.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((slot) => {
                const full = slot.registered >= slot.capacity && !slot.mine;
                return (
                  <div
                    key={slot.id}
                    className={cn(
                      "flex flex-col justify-between rounded-lg border p-4 transition-colors",
                      slot.mine
                        ? "border-cal-office/50 bg-cal-office/10"
: slot.conflict
                          ? "border-status-danger/35 bg-status-danger/5"
: "border-border bg-card"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {slot.day} · {slot.shiftName}
                        </span>
                        <Badge variant={slot.mine ? "calOffice": full ? "secondary": "outline"}>
                          <span className="tabular-mono">
                            {slot.registered}/{slot.capacity} CTV
                          </span>
                        </Badge>
                      </div>
                      <div className="tabular-mono mt-1 text-xs text-muted-foreground">{slot.time}</div>

                      {slot.conflict && (
                        <div className="mt-2.5 flex items-start gap-1.5 rounded-md bg-status-danger/10 p-2 text-xs text-status-danger">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{slot.conflict}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant={slot.mine ? "outline": "default"}
                        disabled={full}
                        className="w-full"
                        onClick={() => handleToggleSlot(slot)}
                      >
                        {slot.mine ? "Hủy đăng ký ca này": full ? "Đã đủ định mức": "Chọn đăng ký ca"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Absence + Makeup & Peer Shift Swap (UC-DUTY-03, UC-DUTY-04) */}
        <TabsContent value="absence" className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-cal-office" />
                <span>Xin Vắng Có Phép &amp; Chọn Ca Bù</span>
              </CardTitle>
              <CardDescription>
                Đơn gửi trước ≥ 2 giờ kèm ca bù hợp lệ (không Chủ Nhật, không trùng lịch) được chấp nhận tự động
                ngay lập tức.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Thời điểm gửi đơn</Label>
                <Select value={absenceMode} onValueChange={(v) => setAbsenceMode(v as "NORMAL" | "URGENT")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Trước ca ≥ 2 giờ (Tự động duyệt kèm Ca bù)</SelectItem>
                    <SelectItem value="URGENT">Cận giờ &lt; 2 giờ (Ngoại lệ · Chờ OFIT Lead duyệt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {absenceMode === "NORMAL" && (
                <div className="space-y-1.5">
                  <Label>Chọn Ca trực bù hợp lệ (T2–T7, đã lọc trùng lịch)</Label>
                  <Select value={makeupShift} onValueChange={setMakeupShift}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s-t5-3">Thứ 5 · Ca 3 (10:00–12:00) · Còn 1 chỗ</SelectItem>
                      <SelectItem value="s-t7-2">Thứ 7 · Ca 2 (09:30–11:30) · Còn 2 chỗ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="absence-reason">Lý do xin vắng</Label>
                <Textarea
                  id="absence-reason"
                  placeholder="Nêu rõ lý do (lịch thi giữa kỳ, cấp cứu, công tác Khoa...)"
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                />
              </div>

              <Button onClick={handleSubmitAbsence} className="w-full">
                <ClipboardCheck className="h-4 w-4" />
                <span>
                  {absenceMode === "NORMAL" ? "Gửi đơn & Chốt ca bù tự động": "Gửi đơn ngoại lệ tới OFIT Lead"}
                </span>
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <span>Yêu cầu Đổi Ca Trực Giữa 2 CTV</span>
              </CardTitle>
              <CardDescription>
                Minh bạch 2 chiều: hệ thống tự kiểm tra trùng lịch của người nhận và gán trách nhiệm điểm danh
                sau khi xác nhận.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {swaps.map((req) => (
                <div key={req.id} className="rounded-lg border border-border bg-muted/25 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-foreground">{req.fromName}</div>
                      <div className="tabular-mono text-xs text-muted-foreground">MSSV: {req.fromMssv}</div>
                    </div>
                    <Badge
                      variant={
                        req.status === "AUTO_APPROVED"
                          ? "success"
: req.status === "PENDING_OFIT"
                            ? "warning"
: "info"
                      }
                    >
                      {req.status === "AUTO_APPROVED"
                        ? "Đã tự duyệt (≥ 24h)"
: req.status === "PENDING_OFIT"
                          ? "Chờ OFIT duyệt"
: "Chờ bạn xác nhận"}
                    </Badge>
                  </div>

                  <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">
                    <div className="font-semibold text-foreground">{req.shiftLabel}</div>
                    <div className="mt-0.5 text-muted-foreground">Lý do: {req.reason}</div>
                  </div>

                  {req.status === "WAITING_PEER" && (
                    <Button size="sm" onClick={() => handleAcceptSwap(req)}>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Xác nhận đồng ý nhận ca (Không trùng lịch)</span>
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
