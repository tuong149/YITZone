# REPORT 04 — Nhận xét Codebase YITZone (Client · Server · API Overview)

**Ngày review:** 19/11/2026
**Phạm vi:** `yitzone-client/` (React + TypeScript + Vite), `yitzone-server/` (Java 21 + Spring Boot), `document/API_Overview_YITZone.md`, cùng hạ tầng liên quan (`docker-compose.yml`, `nginx/`, CI).
**Commit được review:** `9c748de First commit`

**Thang mức độ:**
- 🔴 **Nghiêm trọng**: lỗ hổng bảo mật hoặc lỗi logic làm sai nghiệp vụ cốt lõi, cần sửa trước khi có dữ liệu thật.
- 🟠 **Cao**: lỗi chắc chắn xảy ra trong vận hành hoặc làm hỏng triển khai.
- 🟡 **Trung bình**: nợ kỹ thuật, dễ gây bug khi mở rộng.
- 🟢 **Thấp**: cải thiện chất lượng, nhất quán.

---

## 0. Tóm tắt

Dự án có **tài liệu thiết kế rất chi tiết** (SRS/HLD/LLD/API Overview) và phần khung code đặt nền móng đúng hướng: modular monolith chia package theo nghiệp vụ, response lỗi theo kiểu RFC 9457, validation bằng Bean Validation, Device PoP bằng WebCrypto, chống SSRF cho Web Push, HMAC webhook so sánh hằng thời gian, TypeScript strict, có CI.

Tuy vậy, **khoảng cách giữa tài liệu và code đang rất lớn**. Phần lớn controller ở server là **stub trả dữ liệu giả**, và một số stub trả về kết quả **"thành công/hợp lệ"** cho các luồng bảo mật (xác thực chữ ký thiết bị, xác thực CV, kiểm chứng audit chain, biên nhận phiếu bầu). Đáng chú ý nhất:

| # | Vấn đề | Mức độ |
|---|---|---|
| 1 | `hasPermission('event', 'create')` thực chất chỉ kiểm tra authority `"create"`, nên toàn bộ phân quyền theo permission **không bao giờ khớp** với authority dạng `event:create` | 🔴 |
| 2 | Device PoP **không verify chữ ký ECDSA**, chỉ kiểm tra timestamp và nonce (test hiện tại pass với chữ ký giả `"MEUCIQDf7_mock_ecdsa_sig"`) | 🔴 |
| 3 | Header `X-Active-Scope-Id` do client gửi được tin tuyệt đối, nên bất kỳ user đã đăng nhập nào cũng xem được sự kiện `INTERNAL_CTV` của Ban khác | 🔴 |
| 4 | Check-in tin `qrIssuedAtEpochSeconds` do client gửi, không verify `signedQrPayload`, nên QR không bao giờ hết hạn | 🔴 |
| 5 | Stub ở endpoint công khai trả `valid: true` / `COUNTED_VALID` / `integrityValid: true` cho mọi input | 🔴 |
| 6 | Định dạng chữ ký giữa Client (WebCrypto: raw `r‖s`, base64 chuẩn) và tài liệu (DER `MEUCIQ…`, base64url) không khớp | 🟠 |
| 7 | Container client không dùng `nginx/default.conf`, nên khi chạy bằng Docker `/api`, `/ws` và SPA fallback đều hỏng | 🟠 |
| 8 | `GlobalExceptionHandler` thiếu handler cho lỗi thiếu header, JSON sai, sai method, 404, nên trả **500** thay vì 4xx | 🟠 |
| 9 | Hook quét HID bị reset buffer **mỗi giây** do re-render, làm mất lượt quét | 🟠 |
| 10 | Nút "Xóa hàng đợi Local" xoá cả các scan **chưa đồng bộ** | 🟠 |

---

## 1. Tổng quan kiến trúc & hạ tầng

### Điểm tốt
- Cấu trúc monorepo rõ ràng: `yitzone-client`, `yitzone-server`, `nginx`, `document`, `.github/workflows`.
- `docker-compose.yml` pin version image, có healthcheck cho MongoDB (tự `rs.initiate`) và Redis, `depends_on: condition: service_healthy`.
- Nginx đã tách `/api/` (tắt `proxy_buffering` cho SSE), `/ws/` (Upgrade header, timeout 3600s), `sw.js` no-cache, SPA fallback và security headers cơ bản.
- CI chạy song song server (`mvn test`) và client (typecheck, lint, build).

### Vấn đề

| Mức | Vấn đề | Vị trí | Đề xuất |
|---|---|---|---|
| 🟠 | **`nginx/default.conf` không được dùng ở đâu cả.** `yitzone-client/Dockerfile` chỉ copy `dist` vào `nginx:1.27-alpine` với config mặc định, còn compose không mount volume. Kết quả: khi chạy bằng Docker, `fetch('/api/v1/...')` trả 404/405, `/ws` không proxy, F5 ở `/scanner` bị 404. | [Dockerfile](../yitzone-client/Dockerfile), [docker-compose.yml](../docker-compose.yml) | Thêm `COPY nginx/default.conf /etc/nginx/conf.d/default.conf` (đổi build context về root) hoặc mount volume trong compose. |
| 🟡 | **JWT secret có giá trị mặc định cứng** ở cả `application.yml` và `docker-compose.yml`. Nếu quên set env, production vẫn khởi động với secret công khai trên Git, và ai cũng tự ký được JWT. | [application.yml](../yitzone-server/src/main/resources/application.yml), [docker-compose.yml](../docker-compose.yml) | Bỏ default, fail-fast khi thiếu (`${YITZONE_JWT_SECRET}`), hoặc kiểm tra khi khởi động ở profile `prod`. Tương tự cho `webhook-secret: dev-hmac-secret`. |
| 🟡 | README ghi **React 19** và **Spring Boot 3.3.x**, nhưng thực tế `react@^18.3.1` và `spring-boot-starter-parent 3.4.2`. README cũng link `./HLD_YITZone.md` trong khi file nằm ở `document/`. | [README.md](../README.md) | Đồng bộ lại version và đường dẫn. |
| 🟡 | Biến môi trường không thống nhất: `.env.example` dùng `SILO_ACCESS_KEY`, server đọc `YITZONE_STORAGE_ACCESS_KEY`; `YITZONE_CLAMAV_ENABLED` không có trong `.env.example`. | [.env.example](../.env.example) | Chuẩn hoá một bộ tên biến. |
| 🟢 | CI chạy `npx tsc --noEmit` trên `tsconfig.json` dạng solution (`"files": []`), nên **không typecheck file nào**. Phải đến bước `npm run build` (`tsc -b`) mới thực sự check. | [ci.yml](../.github/workflows/ci.yml) | Đổi thành `npx tsc -b`. |
| 🟢 | MongoDB và Redis expose port ra host, không có auth. Chấp nhận được ở dev, nhưng cần tách `docker-compose.prod.yml`. | `docker-compose.yml` | |
| 🟢 | CORS cho phép `http://localhost:80`, nhưng trình duyệt gửi `Origin: http://localhost` (không kèm port 80). | `application.yml` | Đổi thành `http://localhost`. |

---

## 2. Client — React + TypeScript (`yitzone-client`)

### 2.1. Điểm tốt
- **TypeScript strict** được bật đầy đủ, kể cả `noUncheckedIndexedAccess`, `noUnusedLocals`/`Parameters`.
- Tổ chức theo **feature folder** (`features/attendance`, `features/chatbot`…), có `lib/`, `hooks/`, `stores/`, `components/ui/` theo phong cách shadcn (`cva` + `cn`).
- Stack hợp lý: TanStack Query (server state), Zustand (client state), Dexie (IndexedDB), react-hook-form + zod (đã cài).
- **WebCrypto** tạo khoá ECDSA P-256 với `extractable: false` và lưu `CryptoKeyPair` vào IndexedDB. Đây là cách làm đúng để private key không bao giờ rời khỏi thiết bị.
- Chatbot dùng **POST + `fetch` stream** thay vì `EventSource` GET, nên không lộ token/PII trên URL.
- `useHidBarcodeScanner` có ý tưởng tốt: phân biệt súng quét và người gõ dựa vào khoảng cách giữa các phím, bỏ qua khi focus ở input.

### 2.2. Lỗi logic

| Mức | Vấn đề | Vị trí | Chi tiết & Đề xuất |
|---|---|---|---|
| 🟠 | **Buffer quét HID bị xoá mỗi giây.** | [useHidBarcodeScanner.ts:62-67](../yitzone-client/src/hooks/useHidBarcodeScanner.ts#L62-L67), [OfflineScannerPage.tsx:24-26](../yitzone-client/src/features/attendance/OfflineScannerPage.tsx#L24-L26) | `OfflineScannerPage` có `setInterval` cập nhật `bucket` mỗi 1s, nên component re-render. `onScan`/`onInvalidCode` là arrow function mới mỗi lần render, nằm trong dependency array của `useEffect`, nên effect chạy lại. Cleanup lại gán `bufferRef.current = ""`. Hệ quả: nếu súng quét đang bắn 8 ký tự đúng lúc timer tick, lượt quét bị mất hoặc báo lỗi "không khớp định dạng". **Sửa:** lưu `onScan`/`onInvalidCode` vào ref (`useRef` + cập nhật trong effect riêng) và bỏ chúng khỏi dependency; không reset buffer trong cleanup trừ khi `enabled` đổi. |
| 🟠 | **"Xóa hàng đợi Local" xoá cả scan chưa đồng bộ.** | [OfflineScannerPage.tsx:69-73](../yitzone-client/src/features/attendance/OfflineScannerPage.tsx#L69-L73) | `offlineScanQueue.clear()` xoá toàn bộ, kể cả `synced: false`, nên mất dữ liệu điểm danh không khôi phục được. **Sửa:** chỉ xoá `where('synced').equals(1)` (lưu ý Dexie không index được boolean, nên dùng `0/1`), hoặc thêm confirm dialog hiển thị số bản ghi chưa sync. |
| 🟡 | **SSE parser `trim()` mất khoảng trắng của token.** | [YitBotPage.tsx:52](../yitzone-client/src/features/chatbot/YitBotPage.tsx#L52) | Khi nối LLM thật, các chunk dạng `" chào"` bị trim thành `"chào"`, nên chữ dính liền nhau. Ngoài ra parser chưa xử lý `\r\n`, `data:` nhiều dòng, field `event:` và không có `AbortController` (không huỷ được khi rời trang hoặc gửi câu mới). **Sửa:** chỉ bỏ một dấu cách đầu theo spec SSE (`line.startsWith("data: ") ? line.slice(6) : line.slice(5)`), hoặc dùng `@microsoft/fetch-event-source` như tài liệu đã ghi. |
| 🟡 | **Danh sách scope bị hardcode + trùng key.** | [AppLayout.tsx:76-92](../yitzone-client/src/components/layout/AppLayout.tsx#L76-L92) | Dropdown luôn hiện `EMFIT/SV5T/OFIT/ARTIT` cho mọi người, kể cả khi user không thuộc Ban đó. Nếu `roleScopes` có `scopeId = "EMFIT"` thì sẽ có 2 option trùng `value`. Kết hợp với lỗi server ở mục 3.2-#3, đây là đường khai thác trực tiếp. **Sửa:** chỉ render từ `roleScopes` (cộng `FACULTY` nếu có quyền). |
| 🟡 | `eventId: "DEMO_EVENT"`, `sessionId: "SESSION_1"` hardcode; QR vé là chuỗi tĩnh `"YITZONE-ECDSA-P256-DEMO-TICKET"`. | `OfflineScannerPage.tsx`, `EventsPage.tsx` | Chấp nhận được ở giai đoạn demo, nhưng nên đánh dấu `// TODO` rõ ràng hoặc lấy từ route param. |
| 🟡 | **PWA cache response API có xác thực.** | [vite.config.ts](../yitzone-client/vite.config.ts) (`runtimeCaching` cho `/api/v1/events`) | Cache Storage dùng URL làm key, không phân biệt `Authorization` hay `X-Active-Scope-Id`. Trên máy dùng chung (máy BTC), user B offline có thể thấy danh sách sự kiện nội bộ đã cache của user A. **Sửa:** chỉ cache khi chưa đăng nhập, hoặc thêm `cacheKeyWillBeUsed` gắn userId/scope, và xoá cache khi `clearSession`. |

### 2.3. Kiến trúc & chất lượng code

| Mức | Nhận xét | Đề xuất |
|---|---|---|
| 🟠 | **Chưa có luồng đăng nhập.** Không có trang login, không có nơi nào gọi `setSession`. `ProtectedRoute` được viết nhưng không dùng trong `App.tsx`, nên mọi trang đều public. | Thêm `/login` (OIDC redirect hoặc dev-token), bọc route bằng `ProtectedRoute`, gọi `/iam/me` khi khởi động. |
| 🟡 | **Access token chỉ nằm trong memory (Zustand)**: F5 là mất phiên. Cũng chưa có interceptor response xử lý `401` / refresh token, trong khi server đã cấu hình `refresh-token-ttl-seconds`. | Thiết kế refresh token qua cookie `HttpOnly` + interceptor retry 1 lần. |
| 🟡 | **Code chết:** `stomp-client.ts`, `createCanonicalDevicePop`, `encryptAesGcmJson`/`decryptAesGcmJson`, `ProtectedRoute`, `react-hook-form`, `zod`, `katex`, `@zxing/*` đều chưa được dùng. `VotingPage` chỉ là text tĩnh. | Không xấu ở giai đoạn khung, nhưng nên gom vào issue tracker để không quên. |
| 🟡 | **Chưa có lớp API theo feature.** `EventsPage` gọi `apiClient` trực tiếp trong `queryFn`; `YitBotPage` dùng `fetch` thô, tự gắn header (lặp logic của interceptor). | Tạo `features/events/api.ts` + custom hook `useEvents()`; gom logic header vào một hàm `authHeaders()` dùng chung cho cả axios và fetch. |
| 🟡 | **`useAuthStore()` không selector** ở `AppLayout`/`ProtectedRoute`, nên component re-render khi bất kỳ field nào của store đổi. | `useAuthStore((s) => s.activeScopeId)`; dùng `useShallow` khi lấy nhiều field. |
| 🟡 | **Không có mobile navigation:** `nav` là `hidden md:flex`, nên trên điện thoại (đối tượng chính của PWA) không có cách chuyển trang. | Thêm bottom tab bar hoặc hamburger menu. |
| 🟢 | `ApiResponse<T>` ở client khai báo `data: T` (bắt buộc) nhưng server trả `data` vắng mặt khi lỗi (`@JsonInclude(NON_NULL)`). | Tách `ApiSuccess<T>` / `ApiProblem` thành discriminated union theo `success`. |
| 🟢 | `define: { global: "globalThis" }` chỉ để chiều `sockjs-client`. | Cân nhắc bỏ SockJS, dùng WebSocket thuần (`brokerURL`), vì mọi trình duyệt mục tiêu đều hỗ trợ. |
| 🟢 | Nhiều class màu Tailwind hardcode (`emerald-50`, `red-800`, `text-slate-900`) lẫn với token CSS variables. Chưa có dark mode. | Thêm token `--success`, `--destructive`, `--warning`. |
| 🟢 | **Chưa có test nào** (không có Vitest/RTL). | Ưu tiên test cho `useHidBarcodeScanner`, `webcrypto.ts`, SSE parser: đây là logic thuần, dễ test. |

---

## 3. Server — Java 21 + Spring Boot (`yitzone-server`)

### 3.1. Điểm tốt
- **Package theo module nghiệp vụ** (`attendance`, `voting`, `store`…) + `common/` cho cross-cutting concern, đúng tinh thần modular monolith.
- **Virtual threads** bật qua `spring.threads.virtual.enabled`, phù hợp tải I/O-bound.
- **Response lỗi thống nhất** (`ApiResponse.problem`, `application/problem+json`, có `traceId`, `fieldErrors`).
- **Request DTO dùng `record` + Bean Validation**, `fail-on-unknown-properties: true` giúp chống mass assignment.
- **Webhook VietQR làm đúng**: đọc `byte[]` raw body trước khi parse, kiểm tra timestamp ±300s, HMAC-SHA256 so sánh bằng `MessageDigest.isEqual` (hằng thời gian).
- **Chống SSRF Web Push** bằng allowlist host + bắt buộc HTTPS, có test.
- **`judge-scores` kiểm tra `judgeUserIds` từ DB** thay vì tin request. Đây là pattern đúng, nên nhân rộng.
- `VotingBallotOutbox` không chứa `userId`, đúng thiết kế phiếu kín.
- Unit test cho `WeightedRiskScoringService`, `PiiRedactorService`, `ScopedPermissionEvaluator`, PoP/SSRF.

### 3.2. Lỗi bảo mật & logic 🔴

**#1. `hasPermission(...)` kiểm tra sai chuỗi quyền, nên toàn bộ RBAC theo permission vô hiệu.**
[ScopedPermissionEvaluator.java:20-31](../yitzone-server/src/main/java/vn/edu/fit/yitzone/common/security/ScopedPermissionEvaluator.java#L20-L31)

SpEL `hasPermission('event', 'create')` gọi `hasPermission(auth, targetDomainObject="event", permission="create")`. Code lấy `requiredPermission = permission.toString()`, tức là `"create"`, rồi so khớp với authority. Hệ quả:
- User có authority `event:create` (đúng format trong JWT và trong test) thì **bị từ chối**.
- User có authority tên `create`, `view`, `approve`… thì **được phép ở mọi module** có action trùng tên.

Hiện chỉ `ROLE_STANDING_COMMITTEE` dùng được hệ thống. **Sửa:** ghép `targetDomainObject + ":" + permission` khi target là `String`; viết test tích hợp `@WithMockUser(authorities="event:create")` gọi thử `POST /api/v1/events`.

Ngoài ra, `evaluateGrants()` (logic scope / ancestors / expiresAt đã được test kỹ) **không được gọi từ đâu cả**; `evaluateScopedTarget` bỏ qua `unitId` và `ancestors`. Tức là phần "Scoped" của Scoped RBAC chưa hoạt động.

**#2. Device PoP không verify chữ ký.**
[DevicePopVerifierService.java](../yitzone-server/src/main/java/vn/edu/fit/yitzone/common/security/DevicePopVerifierService.java)

Hàm `verifyAndBuildCanonicalString` dựng chuỗi canonical rồi **trả về mà không verify `signature`** với `publicKeyJwk` trong `DEVICE_TOKENS`. Caller (`AttendanceController`, `VotingController`) cũng bỏ qua giá trị trả về. Test `ApiSecurityContractTest` pass với chữ ký `"MEUCIQDf7_mock_ecdsa_sig"`, chứng tỏ điều này. Thêm vào đó:
- Nonce được ghi vào cache **trước** khi verify, nên kẻ tấn công có thể "đốt" nonce. Nên verify chữ ký trước, ghi nonce sau.
- Cache nonce là `ConcurrentHashMap` in-memory: không dùng được khi chạy nhiều instance và mất khi restart. Tài liệu yêu cầu Redis `SET NX EX 60`.
- `POST /iam/device-tokens` không lưu gì vào DB.

**Sửa:** lưu JWK vào `DEVICE_TOKENS`, rồi verify bằng `Signature.getInstance("SHA256withECDSAinP1363Format")` (WebCrypto xuất chữ ký dạng raw `r‖s` 64 byte, **không phải DER**, xem thêm mục 4.2). Đổi tên hàm để không gây hiểu nhầm.

**#3. `X-Active-Scope-Id` được tin tuyệt đối, dẫn đến lộ sự kiện nội bộ.**
[EventController.java:50-55](../yitzone-server/src/main/java/vn/edu/fit/yitzone/event/controller/EventController.java#L50-L55), [EventController.java:63-71](../yitzone-server/src/main/java/vn/edu/fit/yitzone/event/controller/EventController.java#L63-L71), [ActiveScopeFilter.java](../yitzone-server/src/main/java/vn/edu/fit/yitzone/common/security/ActiveScopeFilter.java)

`ActiveScopeFilter` nhận header mà không kiểm tra user có thuộc scope đó hay không. `EventController` lại cho xem `INTERNAL_CTV` nếu `activeScope == organizerUnitId`. Bất kỳ sinh viên đã đăng nhập nào gửi `X-Active-Scope-Id: EMFIT` đều đọc được sự kiện nội bộ của Ban EMFIT, và client còn hiển thị sẵn dropdown để chọn. **Sửa:** trong filter, đối chiếu header với `roleScopes` của user (từ JWT claim hoặc cache Redis), trả `403` nếu không khớp.

**#4. Check-in QR: client tự khai thời điểm phát QR.**
[AttendanceController.java:55-59](../yitzone-server/src/main/java/vn/edu/fit/yitzone/attendance/controller/AttendanceController.java#L55-L59)

`ageSeconds` tính từ `request.qrIssuedAtEpochSeconds()` do client gửi, trong khi `signedQrPayload` không bao giờ được verify. Client chỉ cần gửi `qrIssuedAt = now` là QR không bao giờ hết hạn (giá trị tương lai cho `ageSeconds` âm cũng pass). Risk score chỉ dựa vào cờ `gpsAvailable` do client tự khai; `lat`/`lng`/`accuracy` bị bỏ qua. Kết quả check-in không được lưu vào `EVENT_ATTENDANCES`. **Sửa:** parse và verify chữ ký server trên `signedQrPayload`, lấy `issuedAt` từ payload đã ký, so với `serverReceivedAt` đúng như tài liệu ghi.

**#5. Stub trả kết quả "hợp lệ" ở endpoint công khai hoặc kiểm toán.**

| Endpoint | Trả về | Rủi ro |
|---|---|---|
| `GET /portfolio/verify/{token}` (public) | `valid: true` cho **mọi** token | Nhà tuyển dụng tin CV giả |
| `GET /voting/campaigns/{id}/verify-receipt` (public) | `COUNTED_VALID` cho mọi mã | Cử tri tin phiếu đã được đếm |
| `GET /audit/verify-chain` | `integrityValid: true` | Kiểm toán sai lệch |
| `GET /audit/logs` | `hashChainVerified: true` | Như trên |
| `POST /duty/shifts/{id}/leave-requests` | `AUTO_APPROVED` không kiểm tra gì | |

**Sửa:** endpoint chưa làm nên trả `501 Not Implemented` hoặc `valid: false`. Stub không bao giờ nên trả kết quả "an toàn giả".

### 3.3. Lỗi xử lý lỗi & vận hành 🟠

| Vấn đề | Vị trí | Chi tiết & Đề xuất |
|---|---|---|
| **Nhiều lỗi client bị trả 500.** | [GlobalExceptionHandler.java](../yitzone-server/src/main/java/vn/edu/fit/yitzone/common/exception/GlobalExceptionHandler.java) | Không có handler cho `MissingRequestHeaderException` (thiếu `Idempotency-Key`, `X-Webhook-*`), `HttpMessageNotReadableException` (JSON sai, **field lạ do `fail-on-unknown-properties`**), `MethodArgumentTypeMismatchException`, `HttpRequestMethodNotSupportedException`, `NoResourceFoundException`, `HandlerMethodValidationException`. Tất cả rơi vào `handleUnexpected`, trả `500` và log ERROR. **Sửa:** cho `GlobalExceptionHandler` `extends ResponseEntityExceptionHandler` rồi override `handleExceptionInternal` để giữ format chung. |
| **Lỗi xác thực ở tầng filter không theo chuẩn.** | [SecurityConfig.java](../yitzone-server/src/main/java/vn/edu/fit/yitzone/common/config/SecurityConfig.java) | Không cấu hình `authenticationEntryPoint` / `accessDeniedHandler`, nên request thiếu token nhận `403` rỗng của Spring (không phải `401` + problem JSON). `@PreAuthorize` từ chối user ẩn danh cũng thành `403` thay vì `401`. |
| **JWT filter nuốt mọi exception.** | [JwtAuthenticationFilter.java:45](../yitzone-server/src/main/java/vn/edu/fit/yitzone/common/security/JwtAuthenticationFilter.java#L45) | Token hết hạn hay sai chữ ký đều im lặng thành anonymous; client không phân biệt được "hết hạn" (để refresh) với "chưa đăng nhập". Claim `permVer` được ghi nhưng **không bao giờ kiểm tra**, nên thu hồi quyền chỉ có hiệu lực sau khi token hết hạn (15 phút), trái với cam kết "≤ 5s". |
| **STOMP chưa xác thực.** | [WebSocketConfig.java](../yitzone-server/src/main/java/vn/edu/fit/yitzone/common/config/WebSocketConfig.java) | Không có interceptor xử lý frame `CONNECT` để đọc `Authorization` từ `connectHeaders`, nên `accessor.getUser()` luôn `null`. Hệ quả: kênh `.admin` **không ai subscribe được**, còn kênh thường mở cho mọi người. `setAllowedOriginPatterns("*")` cho phép mọi origin. Kiểm tra quyền dùng `contains("voting:host")` (so khớp chuỗi con) dễ khớp nhầm. |
| **Idempotency in-memory, có race condition.** | [StoreController.java:50-64](../yitzone-server/src/main/java/vn/edu/fit/yitzone/store/controller/StoreController.java#L50-L64) | `get` rồi `put` không atomic: 2 request song song cùng key đều tạo đơn. Map không giới hạn kích thước (memory leak), mất khi restart, không phát hiện "cùng key nhưng khác body". **Sửa:** Redis `SET idemp:{...} NX EX 86400` như tài liệu; tối thiểu dùng `computeIfAbsent`. |
| **Mỗi request chatbot tạo một `ExecutorService` mới và không đóng.** | [ChatbotController.java:30](../yitzone-server/src/main/java/vn/edu/fit/yitzone/chatbot/controller/ChatbotController.java#L30) | Nên inject một `Executor` bean dùng chung (hoặc `try-with-resources`). Chưa có rate limit hay budget breaker dù `application.yml` đã khai báo. |
| **Phân trang sai khi lọc sau `findAll(pageable)`.** | [EventController.java:51-55](../yitzone-server/src/main/java/vn/edu/fit/yitzone/event/controller/EventController.java#L51-L55) | Lấy 20 bản ghi rồi mới filter, nên trang có thể trả 0–19 phần tử, client không biết còn trang sau hay không. **Sửa:** đưa điều kiện visibility vào query Mongo (`Criteria.orOperator`). |

### 3.4. Thiết kế & chất lượng code 🟡

| Nhận xét | Đề xuất |
|---|---|
| **Controller gọi thẳng Repository, không có tầng Service.** Business rule (A16, ISS-08, lọc visibility) nằm trong controller, khó test và tái sử dụng. | Thêm `EventService`, `AttendanceService`…; controller chỉ map DTO và gọi service. |
| **Trả `@Document` entity trực tiếp** (`ApiResponse<Event>`), làm lộ `riskReviewThreshold`, `allowBarcodeWalkIn`, `version`, và trái với nguyên tắc "Strict DTO" trong chính API Overview §4.3. | Response DTO (record) + MapStruct (đã có trong `pom.xml` nhưng chưa dùng). |
| **Response dạng `Map<String, Object>`** ở hầu hết endpoint: OpenAPI/Swagger không sinh được schema, client không có type. `Map.of(...)` cũng **ném NPE nếu có value `null`**. | Dùng `record` response. |
| `updateEvent`: `version` là optional, nên client không gửi thì ghi đè mất dữ liệu (lost update). Trường `benefitTypes` được kiểm tra nhưng **không bao giờ được set**, nên đổi hợp lệ cũng bị bỏ qua âm thầm. `visibility`/`organizerUnitId` không đổi được. | Bắt buộc `version` (hoặc header `If-Match`), xử lý đầy đủ các field. |
| `createEvent`: `organizerUnitId` lấy từ body mà không kiểm tra user thuộc đơn vị đó, nên user có `internal_event:create` có thể tạo sự kiện dưới tên Ban khác. | Lấy từ active scope đã được xác thực. |
| `SecurityConfig` `permitAll` theo path cho **mọi HTTP method** (`/api/v1/events`, `/api/v1/cms/posts/**`). Hiện `@PreAuthorize` vẫn chặn được POST/PUT, nhưng endpoint ghi mới thêm vào `cms/posts` mà quên annotation sẽ bị public. | `requestMatchers(HttpMethod.GET, ...)`. |
| **Dev-token cho phép tự chọn `userId` bất kỳ** (impersonation) khi bật cờ. Đã có allowlist authority, nhưng vẫn mạo danh được người khác. | Chỉ bật bằng `@Profile("dev")` (bean không tồn tại ở prod) thay vì cờ cấu hình. |
| Lombok khai báo trong `pom.xml` nhưng toàn bộ entity viết getter/setter tay. `@EnableMongoAuditing` bật nhưng dùng `Instant.now()` ở field initializer thay vì `@CreatedDate`. `@EnableScheduling` không có job nào. `spring-boot-starter-oauth2-client` + `thymeleaf` + `mail` chưa dùng. | Dọn dependency; chọn một trong hai (Lombok hoặc record/getter tay) cho nhất quán. |
| `ApiResponse` trả `detail` và `message` trùng nội dung; `traceId` là UUID ngẫu nhiên **không xuất hiện trong log**, nên không truy vết được. | Lấy traceId từ Micrometer Tracing / MDC và log cùng ID. |
| `PiiRedactorService`: regex phone không có `\b` và không bắt các dạng `0912 345 678`, `0912.345.678`; MSSV regex `\b\d{8}\b` sẽ redact cả số tiền hoặc ngày dạng `20261119`. | Chấp nhận false-positive cho MSSV, nhưng bổ sung các biến thể số điện thoại. |
| Kiến trúc "modular monolith" chưa có cơ chế **cưỡng chế ranh giới module** (module nào cũng import `common.security` và repository của module khác được). | Cân nhắc **Spring Modulith** hoặc **ArchUnit** test. |

### 3.5. Kiểm thử
- Test hiện có là unit test thuần, tốt cho logic tính điểm. Tuy nhiên **chưa có test nào khởi động Spring context** (`@WebMvcTest`/`@SpringBootTest`), nên các lỗi #1 (`hasPermission`), lỗi 500 do thiếu header và lỗi STOMP đều lọt qua CI.
- `ApiSecurityContractTest` đang **khẳng định hành vi sai** (PoP pass với chữ ký giả). Khi sửa #2, test này phải được viết lại với cặp khoá thật.
- `ScopedPermissionEvaluatorTest` test `evaluateGrants()`, một hàm không được dùng trong runtime.
- **Đề xuất:** thêm `@WebMvcTest` cho từng controller với `@WithMockUser(authorities=...)`, cùng Testcontainers (MongoDB + Redis) cho test tích hợp.

---

## 4. Tài liệu `API_Overview_YITZone.md`

### 4.1. Điểm tốt
- Bao phủ rất rộng: 20 phân hệ, 4 kênh giao tiếp (REST, SSE, STOMP, Webhook), truy vết ngược về mã yêu cầu SRS (`FR-*`, `NFR-*`, `Edge *`, `A*`).
- Hai sơ đồ Mermaid tổng quan và phân nhóm theo tác nhân giúp người mới nắm bức tranh nhanh.
- Mục 4 (Cross-cutting standards) có giá trị cao: chuẩn PoP, phân trang, idempotency, optimistic lock, RFC 9457. Đây chính là "hợp đồng" mà code cần tuân theo.
- Có ý thức bảo mật tốt: POST-only SSE, barcode-lookup bằng body thay vì URL, rate limit cho endpoint verify, SSRF allowlist.

### 4.2. Mâu thuẫn nội bộ trong tài liệu

| Mức | Mâu thuẫn | Vị trí |
|---|---|---|
| 🟠 | **Định dạng chữ ký PoP.** Ví dụ ghi `"MEUCIQDf7...base64url_ecdsa_p256_signature..."`: tiền tố `MEUCIQ` là **DER/ASN.1**, encoding là **base64url**. Nhưng WebCrypto `crypto.subtle.sign` xuất **raw `r‖s` (IEEE P1363, 64 byte)**, và client hiện encode bằng `btoa` (**base64 chuẩn**, không phải base64url). Nếu server làm theo tài liệu (`SHA256withECDSA` + base64url) thì **100% chữ ký sẽ fail**. | §4.1 |
| 🟡 | **Chuỗi canonical PoP có hai định nghĩa:** §2 và §3.3 ghi `method\|path\|userId\|ts\|nonce\|bodySha256` (hash toàn bộ body), còn §4.1 ghi `SHA-256(canonicalActionFields)` (hash một số field chọn lọc). Code đang theo §4.1. | §2 (H2), §3.3, §4.1 |
| 🟡 | **Phân trang `/events`:** §3.2 ghi "Cursor/Offset Pagination", §4.2 liệt kê `GET /api/v1/events?cursor=...&limit=20` trong nhóm **bắt buộc cursor**. Code dùng `page`/`size`. | §3.2, §4.2 |
| 🟡 | **Số phân hệ:** tài liệu nói **20 phân hệ**, còn README, client (`ModuleDirectoryPage`) và server nói **22 module**. | §1 |
| 🟢 | Ví dụ lỗi dùng `errorCode: "ATT_QR_EXPIRED"`, `type: .../attendance-qr-expired`, nhưng enum trong code là `QR_EXPIRED`, sinh slug `qr-expired`. | §4.4 |

### 4.3. Lệch giữa tài liệu và code (implementation gap)

| Tài liệu yêu cầu | Code hiện tại |
|---|---|
| PoP: cookie `yitz_dt` + `DevicePopVerificationFilter` + Redis `SET NX` + verify chữ ký bằng `publicKeyJwk` | Không có cookie, không có filter, nonce in-memory, **không verify chữ ký** |
| Hạn QR tính theo `serverReceivedAt` | Tính theo `qrIssuedAt` do client gửi |
| Idempotency lưu Redis 24h | `ConcurrentHashMap` (store/orders); các endpoint khác chỉ echo lại key |
| Optimistic lock qua `If-Match` / `version` bắt buộc | `version` optional trong body, không hỗ trợ `If-Match` |
| RFC 9457 dùng `ProblemDetail` của Spring | Record `ApiResponse` tự định nghĩa, thêm field `success`, `message`, `data` |
| Rate limit + `429` + `Retry-After` | Chưa có ở đâu |
| "Tuyệt đối không bind trực tiếp vào `@Document` entity" | Response trả thẳng entity `Event` |
| `GET /oauth2/authorization/{provider}` | Chưa cấu hình `oauth2Login()` trong `SecurityConfig` |
| SSE dùng `fetch-event-source` | Client tự viết parser |
| Khoảng 100 endpoint | Khoảng 45 endpoint, phần lớn là stub; thiếu `/rbac/*`, `/participations/*`, `/notifications/*`, `/sv5t/*`… |
| `/topic/voting.{id}.admin` được bảo vệ | Không ai subscribe được (STOMP chưa có auth) |

### 4.4. Góp ý về cấu trúc tài liệu

1. **Thiếu cột trạng thái triển khai.** Người đọc không biết endpoint nào đã có, endpoint nào là kế hoạch. Đề xuất thêm cột `Status` (`✅ Done` / `🚧 Stub` / `📋 Planned`) và cột `Auth` (`Public` / `JWT` / `JWT + PoP` / permission cụ thể như `event:create`).
2. **Thiếu hợp đồng request/response.** Bảng hiện chỉ mô tả nghiệp vụ, không có schema body, status code thành công (ví dụ check-in trả `202` khi `PENDING_REVIEW`, đây là hành vi quan trọng nhưng chưa được ghi), danh sách mã lỗi theo endpoint. Đề xuất: coi **OpenAPI (springdoc) là nguồn sự thật**, còn tài liệu này giữ vai trò "bản đồ" và link sang Swagger UI.
3. **Trộn lẫn SRS và API contract.** Nhiều ô chứa quy tắc nghiệp vụ dài (ví dụ "phút 0–15: ON_TIME; 16–30: LATE…"). Nên để quy tắc ở SRS/LLD, còn API Overview chỉ tham chiếu mã `FR-*`.
4. **Thiếu đặc tả STOMP/SSE:** chưa có format message cho từng topic, tên event SSE (`chunk`, `done`), cách gửi JWT khi `CONNECT`.
5. **Webhook:** cần ghi rõ chuỗi được ký là `"{timestamp}." + rawBody` (code đang làm vậy), định dạng chữ ký (`hex`, có hay không tiền tố `sha256=`) để bên tích hợp làm theo.
6. **Danh mục quyền:** nên có một bảng tập trung liệt kê tất cả permission string (`event:create`, `attendance:scan_barcode`…) và gói module `MOD_*` tương ứng. Hiện chúng rải rác khắp tài liệu và code, dẫn đến lỗi như mục 3.2-#1.
7. Định dạng dùng LaTeX (`$\le 5\text{s}$`, `$\rightarrow$`) và các ký tự `\|` trong bảng: GitHub render được, nhưng nhiều viewer Markdown khác (VS Code preview mặc định, Confluence) thì không. Có thể đơn giản hoá thành `≤ 5s`, `→`.

---

## 5. Lộ trình đề xuất

**Ưu tiên 1: trước khi có người dùng thật**
1. Sửa `ScopedPermissionEvaluator` (#1) và nối `evaluateGrants` vào runtime; thêm `@WebMvcTest` kiểm chứng.
2. Validate `X-Active-Scope-Id` với `roleScopes` của user (#3); client chỉ hiển thị scope user sở hữu.
3. Hiện thực verify chữ ký PoP thật (P1363, chốt base64 hay base64url), nonce trên Redis (#2); cập nhật tài liệu §4.1 cho khớp.
4. Verify `signedQrPayload` khi check-in (#4).
5. Đổi các stub "luôn hợp lệ" sang `501` / `valid:false` (#5).
6. Bỏ default cho JWT secret và webhook secret.

**Ưu tiên 2: để hệ thống chạy được end-to-end**
7. Sửa Dockerfile client dùng `nginx/default.conf`.
8. Bổ sung handler lỗi (`ResponseEntityExceptionHandler`, `AuthenticationEntryPoint`).
9. Xác thực STOMP `CONNECT`, giới hạn allowed origins.
10. Luồng đăng nhập ở client + `ProtectedRoute` + refresh token.
11. Sửa hook HID (ref callback) và nút xoá hàng đợi (chỉ xoá bản ghi đã sync).

**Ưu tiên 3: chất lượng & khả năng mở rộng**
12. Tầng Service + Response DTO (record/MapStruct); bỏ `Map<String,Object>`.
13. Idempotency, rate limit trên Redis.
14. Test: Vitest cho client, `@WebMvcTest` + Testcontainers cho server; sửa CI `tsc -b`.
15. Bổ sung cột Status/Auth vào API Overview, đồng bộ các mâu thuẫn ở mục 4.2, sinh tài liệu chi tiết từ OpenAPI.

---

*Báo cáo dựa trên việc đọc mã nguồn tĩnh tại commit `9c748de`; chưa chạy build hay test.*
