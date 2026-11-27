import { useRef, useState } from "react";
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

const INITIAL_SLOTS = [];

const INITIAL_SWAPS = [];

export function OfficeDutyPage() {
  const [checkInState, setCheckInState] = useState("IDLE");
  const [gpsStatusText, setGpsStatusText] = useState("Xác thực vị trí GPS khi bấm Check-in");
  const [checkedItems, setCheckedItems] = useState(CLEANING_CHECKLIST.map(() => false));
  const [photoFileName, setPhotoFileName] = useState(null);
  const photoInputRef = useRef(null);
  const [logNote, setLogNote] = useState("");
  const [slots, setSlots] = useState(INITIAL_SLOTS);
  const [swaps, setSwaps] = useState(INITIAL_SWAPS);

  // Absence & makeup state (UC-DUTY-03)
  const [absenceMode, setAbsenceMode] = useState("NORMAL");
  const [makeupShift, setMakeupShift] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const [notice, setNotice] = useState(null);

  const completedChecklist = checkedItems.filter(Boolean).length;
  const canCheckOut = checkInState === "ON_TIME" || checkInState === "LATE";
  const myRegisteredCount = slots.filter((s) => s.mine).length;
  const availableMakeupSlots = slots.filter(
    (s) => !s.mine && s.registered < s.capacity && !s.conflict
  );

  const handleCheckIn = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatusText(
            `Đã ghi nhận tọa độ (±${Math.round(pos.coords.accuracy)}m)`
          );
        },
        () => {
          setGpsStatusText("Chưa cấp quyền định vị trình duyệt");
        },
        { timeout: 5000 }
      );
    }
    setCheckInState("ON_TIME");
    setNotice(
      "Đã gửi yêu cầu Check-in đầu ca! Hệ thống mở tạm quyền phát vật phẩm tại bàn trực trong ca."
    );
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);
    e.target.value = "";
  };

  const handleToggleSlot = (slot) => {
    if (slot.conflict && !slot.mine) {
      setNotice(`Không thể đăng ký ${slot.day} · ${slot.shiftName}: ${slot.conflict}.`);
      return;
    }
    if (slot.registered >= slot.capacity && !slot.mine) return;
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id
          ? { ...s, mine: !s.mine, registered: s.mine ? s.registered - 1 : s.registered + 1 }
          : s
      )
    );
  };

  const handleSubmitAbsence = () => {
    if (absenceReason.trim().length < 6) {
      setNotice("Vui lòng nhập lý do xin vắng tối thiểu 6 ký tự.");
      return;
    }
    if (absenceMode === "NORMAL" && availableMakeupSlots.length > 0 && !makeupShift) {
      setNotice("Vui lòng chọn ca trực bù hợp lệ trước khi gửi đơn.");
      return;
    }
    if (absenceMode === "NORMAL") {
      setNotice(
        "Đã gửi đơn xin vắng (≥ 2 giờ) kèm ca bù lên máy chủ để đối chiếu và cập nhật Lịch Của Tôi."
      );
    } else {
      setNotice(
        "Đơn ngoại lệ cận giờ (< 2 giờ) đã chuyển vào hàng chờ Trưởng/Phó Ban OFIT duyệt thủ công."
      );
    }
    setAbsenceReason("");
  };

  const handleAcceptSwap = (req) => {
    const nextStatus = req.hoursBefore >= 24 ? "AUTO_APPROVED" : "PENDING_OFIT";
    setSwaps((prev) => prev.map((s) => (s.id === req.id ? { ...s, status: nextStatus } : s)));
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
            Đã đăng ký: {myRegisteredCount} ca
          </Badge>
          <Button asChild variant="glass">
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
                <CardTitle>Điểm danh Ca trực Văn phòng</CardTitle>
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
                  <div className="mt-1 text-xs font-medium text-foreground">
                    {gpsStatusText}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/35 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-cal-office" />
                    <span>Cửa sổ Check-out cuối ca</span>
                  </div>
                  <div className="tabular-mono mt-1 text-xs font-medium text-foreground">
                    Mở từ -5 phút đến +15 phút cuối ca
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
                {checkInState === "IDLE" && (
                  <Button type="button" onClick={handleCheckIn}>
                    <UserCheck className="h-4 w-4" />
                    <span>Check-in Đầu ca</span>
                  </Button>
                )}
                {canCheckOut && (
                  <Button
                    type="button"
                    onClick={() => {
                      setCheckInState("CHECKED_OUT");
                      setNotice("Check-out cuối ca thành công! Nhật ký trực đã được lưu.");
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Check-out Cuối ca</span>
                  </Button>
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
                <Badge variant={completedChecklist === CLEANING_CHECKLIST.length ? "success" : "secondary"}>
                  {completedChecklist}/{CLEANING_CHECKLIST.length} hạng mục
                </Badge>
              </div>
              <CardDescription>
                Bắt buộc hoàn thành {CLEANING_CHECKLIST.length} hạng mục và đính kèm ảnh hiện trạng trước khi Check-out.
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
                        setCheckedItems((prev) => prev.map((v, i) => (i === idx ? !v : v)))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="leading-snug">{item}</span>
                  </label>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/25 p-3.5">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground">
                    <Camera className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {photoFileName
                        ? `${photoFileName} (Đã đính kèm)`
                        : "Chưa có ảnh hiện trạng sau vệ sinh"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {photoFileName ? "Đổi ảnh" : "Chọn ảnh"}
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
              <CardTitle>Đăng ký Đợt Trực Văn phòng</CardTitle>
              <CardDescription>
                6 ca cố định (T2–T7) + Ca Vệ sinh T6 (16:50–17:30). Hệ thống tự động đối chiếu trùng giờ với Lịch Của Tôi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/25 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Chưa có đợt đăng ký ca trực nào đang mở
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lịch đăng ký ca trực tuần mới sẽ hiển thị tại đây ngay khi Ban Văn phòng (OFIT) mở cổng.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                            <Badge variant={slot.mine ? "calOffice" : full ? "secondary" : "outline"}>
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
                            variant={slot.mine ? "outline" : "default"}
                            disabled={full}
                            className="w-full"
                            onClick={() => handleToggleSlot(slot)}
                          >
                            {slot.mine ? "Hủy đăng ký ca này" : full ? "Đã đủ định mức" : "Chọn đăng ký ca"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                Đơn gửi trước ≥ 2 giờ kèm ca bù hợp lệ (không Chủ Nhật, không trùng lịch) được chấp nhận tự động ngay lập tức.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Thời điểm gửi đơn</Label>
                <Select value={absenceMode} onValueChange={(v) => setAbsenceMode(v)}>
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
                  {availableMakeupSlots.length > 0 ? (
                    <Select value={makeupShift} onValueChange={setMakeupShift}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ca trực bù còn chỗ" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMakeupSlots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.day} · {slot.shiftName} ({slot.time}) · Còn {slot.capacity - slot.registered} chỗ
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/25 px-3 py-2.5 text-xs text-muted-foreground">
                      Chưa có danh sách ca trực bù trống trong chu kỳ hiện tại.
                    </div>
                  )}
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

              <Button type="button" onClick={handleSubmitAbsence} className="w-full">
                <ClipboardCheck className="h-4 w-4" />
                <span>
                  {absenceMode === "NORMAL" ? "Gửi đơn & Chốt ca bù tự động" : "Gửi đơn ngoại lệ tới OFIT Lead"}
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
                Minh bạch 2 chiều: hệ thống tự kiểm tra trùng lịch của người nhận và gán trách nhiệm điểm danh sau khi xác nhận.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {swaps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/25 px-6 py-10 text-center text-xs text-muted-foreground">
                  Hiện chưa có yêu cầu đổi ca trực nào đang chờ bạn xác nhận.
                </div>
              ) : (
                swaps.map((req) => (
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
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
