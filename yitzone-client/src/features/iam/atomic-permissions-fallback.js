/**
 * Client-side fallback mirroring AtomicPermissionCatalog.java
 * so the permission picker stays functional even if /api/v1/rbac/permissions is unavailable.
 */
export const FALLBACK_ATOMIC_PERMISSIONS = [
  // Nhân sự nội bộ Ban/Tổ
  { code: "hr:directory_view", groupCode: "HR", groupLabel: "Nhân sự nội bộ Ban/Tổ", label: "Xem danh bạ nhân sự đơn vị", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "hr:propose", groupCode: "HR", groupLabel: "Nhân sự nội bộ Ban/Tổ", label: "Đề xuất tiếp nhận / cập nhật nhân sự", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "hr:execute_team", groupCode: "HR", groupLabel: "Nhân sự nội bộ Ban/Tổ", label: "Thực thi nhân sự cấp Tổ", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "hr:approve_committee", groupCode: "HR", groupLabel: "Nhân sự nội bộ Ban/Tổ", label: "Phê duyệt & điều chuyển nhân sự cấp Ban", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "hr:announce_unit", groupCode: "HR", groupLabel: "Nhân sự nội bộ Ban/Tổ", label: "Gửi thông báo nội bộ đơn vị", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Sự kiện nội bộ Ban/Tổ
  { code: "internal_event:create", groupCode: "INTERNAL_EVENT", groupLabel: "Sự kiện nội bộ Ban/Tổ", label: "Tạo sự kiện nội bộ CTV", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "internal_event:update", groupCode: "INTERNAL_EVENT", groupLabel: "Sự kiện nội bộ Ban/Tổ", label: "Cập nhật sự kiện nội bộ CTV", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "internal_event:attendance", groupCode: "INTERNAL_EVENT", groupLabel: "Sự kiện nội bộ Ban/Tổ", label: "Điểm danh sự kiện nội bộ", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Tổ chức Sự kiện Khoa
  { code: "event:create", groupCode: "EVENT_OPS", groupLabel: "Tổ chức Sự kiện Khoa", label: "Tạo kế hoạch sự kiện Khoa", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "event:update", groupCode: "EVENT_OPS", groupLabel: "Tổ chức Sự kiện Khoa", label: "Chỉnh sửa kế hoạch sự kiện", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "event:manage_btc", groupCode: "EVENT_OPS", groupLabel: "Tổ chức Sự kiện Khoa", label: "Điều phối & duyệt Ban Tổ chức", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "attendance:review_queue", groupCode: "EVENT_OPS", groupLabel: "Tổ chức Sự kiện Khoa", label: "Xử lý hàng chờ hậu kiểm 48h", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "cert:view_event", groupCode: "EVENT_OPS", groupLabel: "Tổ chức Sự kiện Khoa", label: "Xem danh sách E-Certificate sự kiện", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Điểm danh & Soát vé
  { code: "attendance:open_session", groupCode: "ATTENDANCE", groupLabel: "Điểm danh & Soát vé", label: "Mở / đóng phiên điểm danh", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "attendance:qr_display", groupCode: "ATTENDANCE", groupLabel: "Điểm danh & Soát vé", label: "Chiếu mã QR động hội trường", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "attendance:barcode_scan", groupCode: "ATTENDANCE", groupLabel: "Điểm danh & Soát vé", label: "Quét mã vạch 1D thẻ sinh viên", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "attendance:offline_sync", groupCode: "ATTENDANCE", groupLabel: "Điểm danh & Soát vé", label: "Tải gói & đồng bộ soát vé ngoại tuyến", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "attendance:manual_override", groupCode: "ATTENDANCE", groupLabel: "Điểm danh & Soát vé", label: "Điểm danh bù bằng tay", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Minigame, Live Q&A & Thi
  { code: "minigame:host", groupCode: "STAGE_EXAM", groupLabel: "Minigame, Live Q&A & Thi", label: "Mở & điều khiển phòng Minigame", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "liveqa:moderate", groupCode: "STAGE_EXAM", groupLabel: "Minigame, Live Q&A & Thi", label: "Kiểm duyệt câu hỏi Live Q&A", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "voting:host", groupCode: "STAGE_EXAM", groupLabel: "Minigame, Live Q&A & Thi", label: "Điều khiển màn hình LED Voting", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "exam:proctor", groupCode: "STAGE_EXAM", groupLabel: "Minigame, Live Q&A & Thi", label: "Coi thi & hậu kiểm trắc nghiệm", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "exam:transfer_device", groupCode: "STAGE_EXAM", groupLabel: "Minigame, Live Q&A & Thi", label: "Cấp phép chuyển thiết bị thi", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Sinh viên 5 tốt (SV5T)
  { code: "sv5t:progress_view", groupCode: "SV5T", groupLabel: "Sinh viên 5 tốt (SV5T)", label: "Theo dõi tiến độ 5 tiêu chí SV5T", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "sv5t:remind", groupCode: "SV5T", groupLabel: "Sinh viên 5 tốt (SV5T)", label: "Gửi nhắc nhở bổ sung minh chứng", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "sv5t:preliminary_review", groupCode: "SV5T", groupLabel: "Sinh viên 5 tốt (SV5T)", label: "Rà soát sơ bộ hồ sơ SV5T", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Ban Văn phòng (OFIT)
  { code: "office:asset_manage", groupCode: "OFFICE", groupLabel: "Ban Văn phòng (OFIT)", label: "Quản lý danh mục & kiểm kê tài sản", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "office:borrow_manage", groupCode: "OFFICE", groupLabel: "Ban Văn phòng (OFIT)", label: "Lập & xác nhận phiếu mượn - trả", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "duty:schedule_manage", groupCode: "OFFICE", groupLabel: "Ban Văn phòng (OFIT)", label: "Điều phối lịch trực văn phòng", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "duty:approve_urgent_leave", groupCode: "OFFICE", groupLabel: "Ban Văn phòng (OFIT)", label: "Duyệt xin vắng cận giờ (<2h)", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "duty:approve_swap_exception", groupCode: "OFFICE", groupLabel: "Ban Văn phòng (OFIT)", label: "Duyệt đổi ca trực ngoại lệ", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "office:finalize_audit_diff", groupCode: "OFFICE", groupLabel: "Ban Văn phòng (OFIT)", label: "Chốt biên bản chênh lệch kiểm kê", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Ban Văn nghệ (ARTIT)
  { code: "arts:act_manage", groupCode: "ARTS", groupLabel: "Ban Văn nghệ (ARTIT)", label: "Quản lý tiết mục & đội hình diễn", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "arts:media_upload", groupCode: "ARTS", groupLabel: "Ban Văn nghệ (ARTIT)", label: "Tải lên file nhạc nền & visual LED", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "arts:finalize_act", groupCode: "ARTS", groupLabel: "Ban Văn nghệ (ARTIT)", label: "Chốt duyệt tiết mục & khóa file diễn", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "arts:emergency_unlock", groupCode: "ARTS", groupLabel: "Ban Văn nghệ (ARTIT)", label: "Mở khóa khẩn cấp file diễn (20 phút)", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Bản tin & Truyền thông
  { code: "cms:create", groupCode: "CMS", groupLabel: "Bản tin & Truyền thông", label: "Soạn thảo bài viết bản tin", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "cms:edit", groupCode: "CMS", groupLabel: "Bản tin & Truyền thông", label: "Biên tập & tiếp nhận bài cộng tác", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "cms:approve", groupCode: "CMS", groupLabel: "Bản tin & Truyền thông", label: "Phê duyệt xuất bản bài viết", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "cms:schedule_publish", groupCode: "CMS", groupLabel: "Bản tin & Truyền thông", label: "Hẹn giờ tự động đăng bài", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Cửa hàng & Gây quỹ
  { code: "store:campaign_manage", groupCode: "STORE", groupLabel: "Cửa hàng & Gây quỹ", label: "Quản lý đợt bán & gây quỹ", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "store:product_manage", groupCode: "STORE", groupLabel: "Cửa hàng & Gây quỹ", label: "Quản lý sản phẩm, giá & voucher", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "store:reconcile", groupCode: "STORE", groupLabel: "Cửa hàng & Gây quỹ", label: "Đối soát sao kê & báo cáo quỹ", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "store:refund_approve", groupCode: "STORE", groupLabel: "Cửa hàng & Gây quỹ", label: "Phê duyệt hoàn tiền đơn hàng", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "store:booth_lookup", groupCode: "STORE", groupLabel: "Cửa hàng & Gây quỹ", label: "Tra cứu đơn hàng tại quầy phát", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "store:order_fulfill", groupCode: "STORE", groupLabel: "Cửa hàng & Gây quỹ", label: "Xác nhận giao vật phẩm tại quầy", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "store:cod_collect", groupCode: "STORE", groupLabel: "Cửa hàng & Gây quỹ", label: "Thu tiền mặt COD tại quầy", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Online Judge
  { code: "oj:problem_manage", groupCode: "OJ", groupLabel: "Online Judge (Thi Lập trình)", label: "Quản lý đề bài & bộ testcase", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "oj:contest_manage", groupCode: "OJ", groupLabel: "Online Judge (Thi Lập trình)", label: "Tổ chức kỳ thi ICPC / IOI", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "oj:plagiarism_view", groupCode: "OJ", groupLabel: "Online Judge (Thi Lập trình)", label: "Xem báo cáo kiểm tra trùng lặp code", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Trợ lý ảo AI YITBot
  { code: "yitbot:draft_create", groupCode: "YITBOT", groupLabel: "Trợ lý ảo AI YITBot", label: "Soạn bản nháp FAQ & tài liệu", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "yitbot:draft_edit", groupCode: "YITBOT", groupLabel: "Trợ lý ảo AI YITBot", label: "Chỉnh sửa bản nháp tài liệu AI", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "yitbot:approve_knowledge", groupCode: "YITBOT", groupLabel: "Trợ lý ảo AI YITBot", label: "Phê duyệt kho tri thức chính thức", sensitiveNonDelegable: true, forbiddenForSystemAdmin: false },
  { code: "yitbot:budget_config", groupCode: "YITBOT", groupLabel: "Trợ lý ảo AI YITBot", label: "Cấu hình hạn mức & ngân sách AI", sensitiveNonDelegable: true, forbiddenForSystemAdmin: false },

  // Khảo sát & Bình chọn
  { code: "survey:manage", groupCode: "SURVEY_POLL", groupLabel: "Khảo sát & Bình chọn", label: "Thiết kế & phát hành khảo sát", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "survey:ai_summary", groupCode: "SURVEY_POLL", groupLabel: "Khảo sát & Bình chọn", label: "Tổng hợp báo cáo khảo sát AI", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "voting:campaign_manage", groupCode: "SURVEY_POLL", groupLabel: "Khảo sát & Bình chọn", label: "Quản lý chiến dịch Voting / Bầu cử", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "voting:export_minutes", groupCode: "SURVEY_POLL", groupLabel: "Khảo sát & Bình chọn", label: "Xuất biên bản kiểm phiếu", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Hộp thư Hỏi - Đáp BCH
  { code: "qachat:inbox_view", groupCode: "QA_MESSENGER", groupLabel: "Hộp thư Hỏi - Đáp BCH", label: "Xem hộp thư chung BCH", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "qachat:claim", groupCode: "QA_MESSENGER", groupLabel: "Hộp thư Hỏi - Đáp BCH", label: "Tiếp nhận hội thoại hỗ trợ", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "qachat:reply", groupCode: "QA_MESSENGER", groupLabel: "Hộp thư Hỏi - Đáp BCH", label: "Trả lời & ghi chú nội bộ BCH", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },
  { code: "qachat:student_summary", groupCode: "QA_MESSENGER", groupLabel: "Hộp thư Hỏi - Đáp BCH", label: "Xem tóm tắt hồ sơ sinh viên", sensitiveNonDelegable: false, forbiddenForSystemAdmin: false },

  // Kiểm toán & Quyền nhạy cảm
  { code: "audit:view", groupCode: "GOVERNANCE", groupLabel: "Kiểm toán & Quyền nhạy cảm", label: "Tra cứu Nhật ký Kiểm tra (chỉ đọc)", sensitiveNonDelegable: true, forbiddenForSystemAdmin: false },
  { code: "liveqa:unmask", groupCode: "GOVERNANCE", groupLabel: "Kiểm toán & Quyền nhạy cảm", label: "Tra cứu danh tính ẩn danh Live Q&A", sensitiveNonDelegable: true, forbiddenForSystemAdmin: true }
];
