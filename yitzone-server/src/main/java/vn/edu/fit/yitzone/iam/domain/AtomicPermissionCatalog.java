package vn.edu.fit.yitzone.iam.domain;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Centralized catalog of valid atomic permissions that can be composed into custom PermissionModules (UC-IAM-09).
 */
public final class AtomicPermissionCatalog {
    private AtomicPermissionCatalog() {
    }

    public record PermissionDefinition(
            String code,
            String groupCode,
            String groupLabel,
            String label,
            String description,
            boolean sensitiveNonDelegable,
            boolean forbiddenForSystemAdmin
    ) {
    }

    private static final List<PermissionDefinition> ALL_PERMISSIONS = List.of(
            // 1. Nhân sự nội bộ Ban/Tổ
            perm("hr:directory_view", "HR", "Nhân sự nội bộ Ban/Tổ", "Xem danh bạ nhân sự đơn vị",
                    "Tra cứu danh sách CTV và cán bộ trong phạm vi Ban/Tổ được giao", false, false),
            perm("hr:propose", "HR", "Nhân sự nội bộ Ban/Tổ", "Đề xuất tiếp nhận / cập nhật nhân sự",
                    "Tạo phiếu đề xuất nhân sự ở cấp Tổ phó hoặc Phó Ban", false, false),
            perm("hr:execute_team", "HR", "Nhân sự nội bộ Ban/Tổ", "Thực thi nhân sự cấp Tổ",
                    "Cập nhật trực tiếp danh sách CTV trong phạm vi Tổ trực thuộc", false, false),
            perm("hr:approve_committee", "HR", "Nhân sự nội bộ Ban/Tổ", "Phê duyệt & điều chuyển nhân sự cấp Ban",
                    "Phê duyệt đề xuất nhân sự và điều chuyển giữa các Tổ trong Ban", false, false),
            perm("hr:announce_unit", "HR", "Nhân sự nội bộ Ban/Tổ", "Gửi thông báo nội bộ đơn vị",
                    "Gửi thông báo triệu tập cô lập tới thành viên Ban/Tổ", false, false),

            // 2. Sự kiện nội bộ 4 Ban
            perm("internal_event:create", "INTERNAL_EVENT", "Sự kiện nội bộ Ban/Tổ", "Tạo sự kiện nội bộ CTV",
                    "Lập lịch sinh hoạt / họp nội bộ Ban (không cộng quyền lợi ĐRL/CTXH/CĐDN)", false, false),
            perm("internal_event:update", "INTERNAL_EVENT", "Sự kiện nội bộ Ban/Tổ", "Cập nhật sự kiện nội bộ CTV",
                    "Chỉnh sửa thông tin sự kiện nội bộ thuộc Ban/Tổ", false, false),
            perm("internal_event:attendance", "INTERNAL_EVENT", "Sự kiện nội bộ Ban/Tổ", "Điểm danh sự kiện nội bộ",
                    "Ghi nhận chuyên cần của CTV trong các buổi sinh hoạt nội bộ", false, false),

            // 3. Tổ chức sự kiện cấp Khoa
            perm("event:create", "EVENT_OPS", "Tổ chức Sự kiện Khoa", "Tạo kế hoạch sự kiện Khoa",
                    "Soạn thảo sự kiện đa buổi, biểu mẫu đăng ký và vị trí tuyển BTC", false, false),
            perm("event:update", "EVENT_OPS", "Tổ chức Sự kiện Khoa", "Chỉnh sửa kế hoạch sự kiện",
                    "Cập nhật thông tin sự kiện và gửi thẩm định khi có thay đổi lớn", false, false),
            perm("event:manage_btc", "EVENT_OPS", "Tổ chức Sự kiện Khoa", "Điều phối & duyệt Ban Tổ chức",
                    "Phê duyệt, phân bổ nguyện vọng và điều phối nhân sự BTC sự kiện", false, false),
            perm("attendance:review_queue", "EVENT_OPS", "Tổ chức Sự kiện Khoa", "Xử lý hàng chờ hậu kiểm 48h",
                    "Xem xét và duyệt/từ chối lượt điểm danh bị gắn cờ rủi ro", false, false),
            perm("cert:view_event", "EVENT_OPS", "Tổ chức Sự kiện Khoa", "Xem danh sách E-Certificate sự kiện",
                    "Tra cứu trạng thái hoàn thành và danh sách cấp chứng nhận của sự kiện", false, false),

            // 4. Điểm danh & Soát vé hội trường
            perm("attendance:open_session", "ATTENDANCE", "Điểm danh & Soát vé", "Mở / đóng phiên điểm danh",
                    "Khởi tạo phiên Check-in / Check-out và mở điểm danh sớm BTC", false, false),
            perm("attendance:qr_display", "ATTENDANCE", "Điểm danh & Soát vé", "Chiếu mã QR động hội trường",
                    "Trình chiếu mã QR động luân phiên 10s hoặc QR cố định ngoài trời", false, false),
            perm("attendance:barcode_scan", "ATTENDANCE", "Điểm danh & Soát vé", "Quét mã vạch 1D thẻ sinh viên",
                    "Soát vé bằng camera hoặc súng quét HID và tiếp nhận Walk-in", false, false),
            perm("attendance:offline_sync", "ATTENDANCE", "Điểm danh & Soát vé", "Tải gói & đồng bộ soát vé ngoại tuyến",
                    "Tải danh sách đăng ký về thiết bị BTC và đồng bộ lại khi có mạng", false, false),
            perm("attendance:manual_override", "ATTENDANCE", "Điểm danh & Soát vé", "Điểm danh bù bằng tay (có Audit)",
                    "Nhập MSSV điểm danh bù kèm lý do bắt buộc khi sinh viên gặp sự cố", false, false),

            // 5. Hội trường LED, Minigame & Thi trắc nghiệm
            perm("minigame:host", "STAGE_EXAM", "Minigame, Live Q&A & Thi", "Mở & điều khiển phòng Minigame",
                    "Tạo bộ câu hỏi, phát mã PIN/QR và điều khiển nhịp câu hỏi sân khấu", false, false),
            perm("liveqa:moderate", "STAGE_EXAM", "Minigame, Live Q&A & Thi", "Kiểm duyệt câu hỏi Live Q&A",
                    "Duyệt, ghim hoặc ẩn câu hỏi gửi lên màn hình LED (không xem danh tính ẩn danh)", false, false),
            perm("voting:host", "STAGE_EXAM", "Minigame, Live Q&A & Thi", "Điều khiển màn hình LED Voting",
                    "Mở/đóng phiên bình chọn trực tiếp và bật Freeze Mode trên sân khấu", false, false),
            perm("exam:proctor", "STAGE_EXAM", "Minigame, Live Q&A & Thi", "Coi thi & hậu kiểm trắc nghiệm",
                    "Giám sát phòng thi trực tuyến và xử lý nhật ký vi phạm rời tab", false, false),
            perm("exam:transfer_device", "STAGE_EXAM", "Minigame, Live Q&A & Thi", "Cấp phép chuyển thiết bị thi",
                    "Cho phép thí sinh tiếp tục bài thi trên máy khác khi gặp sự cố kỹ thuật", false, false),

            // 6. Phong trào Sinh viên 5 tốt
            perm("sv5t:progress_view", "SV5T", "Sinh viên 5 tốt (SV5T)", "Theo dõi tiến độ 5 tiêu chí SV5T",
                    "Xem bảng tổng hợp tiến độ đạt tiêu chí của sinh viên đăng ký SV5T", false, false),
            perm("sv5t:remind", "SV5T", "Sinh viên 5 tốt (SV5T)", "Gửi nhắc nhở bổ sung minh chứng",
                    "Nhắc sinh viên hoàn thiện các tiêu chí còn thiếu trước hạn chót", false, false),
            perm("sv5t:preliminary_review", "SV5T", "Sinh viên 5 tốt (SV5T)", "Rà soát sơ bộ hồ sơ SV5T",
                    "Kiểm tra tính đầy đủ minh chứng trước khi trình hội đồng xét duyệt", false, false),

            // 7. Ban Văn phòng (Trực & Tài sản)
            perm("office:asset_manage", "OFFICE", "Ban Văn phòng (OFIT)", "Quản lý danh mục & kiểm kê tài sản",
                    "Cập nhật kho vật dụng văn phòng và thực hiện kiểm kê định kỳ", false, false),
            perm("office:borrow_manage", "OFFICE", "Ban Văn phòng (OFIT)", "Lập & xác nhận phiếu mượn - trả",
                    "Ghi nhận bàn giao và thu hồi tài sản văn phòng cho CTV/BTC", false, false),
            perm("duty:schedule_manage", "OFFICE", "Ban Văn phòng (OFIT)", "Điều phối lịch trực văn phòng",
                    "Xếp ca trực, theo dõi chuyên cần và xử lý ca trống", false, false),
            perm("duty:approve_urgent_leave", "OFFICE", "Ban Văn phòng (OFIT)", "Duyệt xin vắng cận giờ (<2h)",
                    "Thẩm quyền Trưởng/Phó Ban OFIT duyệt ngoại lệ nghỉ trực đột xuất", false, false),
            perm("duty:approve_swap_exception", "OFFICE", "Ban Văn phòng (OFIT)", "Duyệt đổi ca trực ngoại lệ",
                    "Phê duyệt yêu cầu đổi ca trực vượt quy định thông thường", false, false),
            perm("office:finalize_audit_diff", "OFFICE", "Ban Văn phòng (OFIT)", "Chốt biên bản chênh lệch kiểm kê",
                    "Xác nhận và đóng biên bản chênh lệch tài sản sau kiểm kê", false, false),

            // 8. Ban Văn nghệ
            perm("arts:act_manage", "ARTS", "Ban Văn nghệ (ARTIT)", "Quản lý tiết mục & đội hình diễn",
                    "Đăng ký, phân công và cập nhật thông tin tiết mục chương trình", false, false),
            perm("arts:media_upload", "ARTS", "Ban Văn nghệ (ARTIT)", "Tải lên file nhạc nền & visual LED",
                    "Nộp và cập nhật tài nguyên trình diễn phục vụ tổng duyệt", false, false),
            perm("arts:finalize_act", "ARTS", "Ban Văn nghệ (ARTIT)", "Chốt duyệt tiết mục & khóa file diễn",
                    "Thẩm quyền Trưởng/Phó Ban ARTIT chốt danh sách tiết mục sau tổng duyệt", false, false),
            perm("arts:emergency_unlock", "ARTS", "Ban Văn nghệ (ARTIT)", "Mở khóa khẩn cấp file diễn (20 phút)",
                    "Mở khóa tạm thời để thay file kỹ thuật trước giờ diễn", false, false),

            // 9. Bản tin & Truyền thông
            perm("cms:create", "CMS", "Bản tin & Truyền thông", "Soạn thảo bài viết bản tin",
                    "Tạo bản nháp bài viết, gắn thẻ và chọn chuyên mục truyền thông", false, false),
            perm("cms:edit", "CMS", "Bản tin & Truyền thông", "Biên tập & tiếp nhận bài cộng tác",
                    "Chỉnh sửa nội dung và phản hồi bài cộng tác từ sinh viên", false, false),
            perm("cms:approve", "CMS", "Bản tin & Truyền thông", "Phê duyệt xuất bản bài viết",
                    "Xác nhận đạt chuẩn nội dung để công bố lên cổng thông tin", false, false),
            perm("cms:schedule_publish", "CMS", "Bản tin & Truyền thông", "Hẹn giờ tự động đăng bài",
                    "Lên lịch thời điểm xuất bản bài viết tự động", false, false),

            // 10. Cửa hàng vật phẩm & Gây quỹ
            perm("store:campaign_manage", "STORE", "Cửa hàng & Gây quỹ", "Quản lý đợt bán & gây quỹ",
                    "Tạo chiến dịch bán áo khoa, vật phẩm và cấu hình thời gian mở bán", false, false),
            perm("store:product_manage", "STORE", "Cửa hàng & Gây quỹ", "Quản lý sản phẩm, giá & voucher",
                    "Cập nhật biến thể size, tồn kho, giá bán và mã giảm giá", false, false),
            perm("store:reconcile", "STORE", "Cửa hàng & Gây quỹ", "Đối soát sao kê & báo cáo quỹ",
                    "Đối chiếu giao dịch VietQR, tiền mặt COD và xuất báo cáo tài chính", false, false),
            perm("store:refund_approve", "STORE", "Cửa hàng & Gây quỹ", "Phê duyệt hoàn tiền đơn hàng",
                    "Xác nhận yêu cầu hủy đơn và hoàn tiền cho sinh viên", false, false),
            perm("store:booth_lookup", "STORE", "Cửa hàng & Gây quỹ", "Tra cứu đơn hàng tại quầy phát",
                    "Quét QR đơn hàng hoặc mã vạch thẻ SV để kiểm tra tình trạng giao nhận", false, false),
            perm("store:order_fulfill", "STORE", "Cửa hàng & Gây quỹ", "Xác nhận giao vật phẩm tại quầy",
                    "Đánh dấu đã bàn giao áo khoa / vật phẩm cho người mua", false, false),
            perm("store:cod_collect", "STORE", "Cửa hàng & Gây quỹ", "Thu tiền mặt COD tại quầy",
                    "Ghi nhận thu tiền mặt trực tiếp và chốt bàn giao cuối ca", false, false),

            // 11. Thi lập trình Online Judge
            perm("oj:problem_manage", "OJ", "Online Judge (Thi Lập trình)", "Quản lý đề bài & bộ testcase",
                    "Soạn đề bài thuật toán, tải testcase và cấu hình giới hạn chấm bài", false, false),
            perm("oj:contest_manage", "OJ", "Online Judge (Thi Lập trình)", "Tổ chức kỳ thi ICPC / IOI",
                    "Mở kỳ thi lập trình, quản lý bảng xếp hạng và đóng băng BXH", false, false),
            perm("oj:plagiarism_view", "OJ", "Online Judge (Thi Lập trình)", "Xem báo cáo kiểm tra trùng lặp code",
                    "Tra cứu kết quả phát hiện sao chép mã nguồn sau kỳ thi", false, false),

            // 12. Trợ lý ảo AI YITBot
            perm("yitbot:draft_create", "YITBOT", "Trợ lý ảo AI YITBot", "Soạn bản nháp FAQ & tài liệu",
                    "Tải lên dự thảo quy chế và câu hỏi thường gặp trình BTV duyệt", false, false),
            perm("yitbot:draft_edit", "YITBOT", "Trợ lý ảo AI YITBot", "Chỉnh sửa bản nháp tài liệu AI",
                    "Cập nhật nội dung bản nháp trước khi đưa vào kho tri thức chính thức", false, false),
            perm("yitbot:approve_knowledge", "YITBOT", "Trợ lý ảo AI YITBot", "Phê duyệt kho tri thức chính thức",
                    "Nhạy cảm · Chỉ BTV (Non-delegable): đưa tài liệu vào bộ nhớ RAG chính thức", true, false),
            perm("yitbot:budget_config", "YITBOT", "Trợ lý ảo AI YITBot", "Cấu hình hạn mức & ngân sách AI",
                    "Nhạy cảm · Chỉ BTV (Non-delegable): kiểm soát quota và ngân sách gọi LLM", true, false),

            // 13. Khảo sát & Bình chọn
            perm("survey:manage", "SURVEY_POLL", "Khảo sát & Bình chọn", "Thiết kế & phát hành khảo sát",
                    "Tạo biểu mẫu khảo sát sinh viên và liên kết mở khóa E-Cert", false, false),
            perm("survey:ai_summary", "SURVEY_POLL", "Khảo sát & Bình chọn", "Tổng hợp báo cáo khảo sát AI",
                    "Chạy tóm tắt tự động ý kiến phản hồi khi đạt ngưỡng ẩn danh", false, false),
            perm("voting:campaign_manage", "SURVEY_POLL", "Khảo sát & Bình chọn", "Quản lý chiến dịch Voting / Bầu cử",
                    "Thiết lập ứng viên, trọng số BGK/khán giả và chế độ bỏ phiếu kín", false, false),
            perm("voting:export_minutes", "SURVEY_POLL", "Khảo sát & Bình chọn", "Xuất biên bản kiểm phiếu",
                    "Xuất biên bản kết quả biểu quyết / bình chọn chính thức", false, false),

            // 14. Hộp thư Hỏi - Đáp BCH
            perm("qachat:inbox_view", "QA_MESSENGER", "Hộp thư Hỏi - Đáp BCH", "Xem hộp thư chung BCH",
                    "Theo dõi danh sách hội thoại hỗ trợ sinh viên và chỉ báo SLA 24h", false, false),
            perm("qachat:claim", "QA_MESSENGER", "Hộp thư Hỏi - Đáp BCH", "Tiếp nhận hội thoại hỗ trợ",
                    "Nhận phụ trách xử lý yêu cầu từ hộp thư chung", false, false),
            perm("qachat:reply", "QA_MESSENGER", "Hộp thư Hỏi - Đáp BCH", "Trả lời & ghi chú nội bộ BCH",
                    "Phản hồi trực tiếp cho sinh viên và trao đổi qua ghi chú nội bộ", false, false),
            perm("qachat:student_summary", "QA_MESSENGER", "Hộp thư Hỏi - Đáp BCH", "Xem tóm tắt hồ sơ SV (có Audit)",
                    "Xem thông tin tối thiểu của sinh viên để hỗ trợ đúng ngữ cảnh", false, false),

            // 15. Kiểm toán & An toàn dữ liệu nhạy cảm
            perm("audit:view", "GOVERNANCE", "Kiểm toán & Quyền nhạy cảm", "Tra cứu Audit Log Hash-chain (chỉ đọc)",
                    "Nhạy cảm · Non-delegable: xem nhật ký kiểm tra toàn hệ thống", true, false),
            perm("liveqa:unmask", "GOVERNANCE", "Kiểm toán & Quyền nhạy cảm", "Tra cứu danh tính ẩn danh Live Q&A",
                    "Nhạy cảm · Chỉ BTV (Non-delegable, cấm cấp cho SystemAdmin)", true, true)
    );

    private static final Map<String, PermissionDefinition> BY_CODE = ALL_PERMISSIONS.stream()
            .collect(Collectors.toUnmodifiableMap(PermissionDefinition::code, Function.identity()));

    private static PermissionDefinition perm(
            String code,
            String groupCode,
            String groupLabel,
            String label,
            String description,
            boolean sensitiveNonDelegable,
            boolean forbiddenForSystemAdmin
    ) {
        return new PermissionDefinition(code, groupCode, groupLabel, label, description, sensitiveNonDelegable, forbiddenForSystemAdmin);
    }

    public static List<PermissionDefinition> listAll() {
        return ALL_PERMISSIONS;
    }

    public static boolean isKnown(String code) {
        return code != null && BY_CODE.containsKey(code);
    }

    public static Optional<PermissionDefinition> find(String code) {
        return code == null ? Optional.empty() : Optional.ofNullable(BY_CODE.get(code));
    }
}
