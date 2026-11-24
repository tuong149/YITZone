/** @typedef {Object} QrDispatchResult */

const ALLOWED_INTERNAL_PREFIXES = [
  { prefix: "/minigame", label: "Phòng Minigame" },
  { prefix: "/live-qa", label: "Live Q&A Hội trường" },
  { prefix: "/voting", label: "Bình chọn & Bầu cử" },
  { prefix: "/surveys", label: "Khảo sát" },
  { prefix: "/verify/", label: "Xác thực E-Certificate" },
  { prefix: "/events/", label: "Sự kiện" },
  { prefix: "/store/products/", label: "Sản phẩm Cửa hàng" },
  { prefix: "/exam/", label: "Phòng thi trực tuyến" }
];

function matchAllowedPath(pathname, search, hash) {
  for (const rule of ALLOWED_INTERNAL_PREFIXES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix)) {
      return {
        kind: "NAVIGATE",
        to: `${pathname}${search}${hash}`,
        label: rule.label
      };
    }
  }
  return null;
}

/**
 * Classifies any QR code scanned in YITZone's unified QR scanner:
 * - Recognizes internal YITZone URLs (Minigame, Live Q&A, Voting, Surveys, E-Cert verify, Events, Store, Exam)
 * - Recognizes structured YITZONE|... payloads and attendance PINs
 * - Safely blocks external / unrecognized URLs
 */
export function resolveYitZoneQrPayload(rawText) {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      kind: "UNSUPPORTED",
      reason: "Mã QR trống hoặc không đọc được. Vui lòng thử quét lại."
    };
  }

  // 1. Direct relative YITZone path (e.g. "/minigame?pin=739204")
  if (trimmed.startsWith("/")) {
    try {
      const parsed = new URL(trimmed, "https://yitzone.local");
      const matched = matchAllowedPath(parsed.pathname, parsed.search, parsed.hash);
      if (matched) return matched;
    } catch {
      // Fall through
    }
  }

  // 2. Full URL (http/https)
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const isSameOrigin =
        typeof window !== "undefined" && parsed.origin === window.location.origin;
      const isOfficialHost =
        parsed.hostname === "yitzone.fit.hcmute.edu.vn" ||
        parsed.hostname.endsWith(".hcmute.edu.vn") ||
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1";

      if (isSameOrigin || isOfficialHost) {
        const matched = matchAllowedPath(parsed.pathname, parsed.search, parsed.hash);
        if (matched) return matched;
      }

      return {
        kind: "UNSUPPORTED",
        reason: "Mã QR này không thuộc hệ thống YITZone."
      };
    } catch {
      return {
        kind: "UNSUPPORTED",
        reason: "Đường dẫn trong mã QR không hợp lệ."
      };
    }
  }

  // 3. Block dangerous URI schemes (javascript:, data:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return {
      kind: "UNSUPPORTED",
      reason: "Mã QR này không thuộc hệ thống YITZone."
    };
  }

  // 4. Structured YITZONE shorthand payloads
  const upper = trimmed.toUpperCase();
  if (upper.startsWith("YITZONE|MINIGAME|")) {
    const pin = trimmed.split("|")[2]?.replace(/\D/g, "").slice(0, 6);
    if (pin && pin.length === 6) {
      return { kind: "NAVIGATE", to: `/minigame?pin=${pin}`, label: "Phòng Minigame" };
    }
  }
  if (upper.startsWith("YITZONE|LIVEQA|")) {
    const pin = trimmed.split("|")[2]?.trim();
    if (pin) {
      return { kind: "NAVIGATE", to: `/live-qa/${encodeURIComponent(pin)}`, label: "Live Q&A Hội trường" };
    }
  }
  if (upper.startsWith("YITZONE|CERT|")) {
    const code = trimmed.split("|")[2]?.trim();
    if (code) {
      return { kind: "NAVIGATE", to: `/verify/${encodeURIComponent(code)}`, label: "Xác thực E-Certificate" };
    }
  }

  // 5. Attendance QR payload or session/PIN code
  return { kind: "CHECKIN", code: trimmed };
}
