import { useEffect, useRef } from "react";

const STUDENT_CODE_REGEX = /^[0-9]{8}$/;

/**
 * Scoped HID Barcode Wedge Hook (30-50ms/char) for physical Student ID cards (HLD 5.1, LLD 5.1.C, A24).
 * Active ONLY when mounted & enabled on ticket/store/office scanner screens.
 * Uses callback refs so parent re-renders (e.g. 1s bucket timers) do NOT reset the keystroke buffer mid-scan.
 */
export function useHidBarcodeScanner({
  enabled,
  maxCharIntervalMs = 50,
  onScan,
  onInvalidCode
}) {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const onScanRef = useRef(onScan);
  const onInvalidCodeRef = useRef(onInvalidCode);

  useEffect(() => {
    onScanRef.current = onScan;
    onInvalidCodeRef.current = onInvalidCode;
  }, [onScan, onInvalidCode]);

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = "";
      return;
    }

    const handleKeyDown = (event) => {
      const target = event.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      const now = performance.now();
      if (now - lastKeyTimeRef.current > maxCharIntervalMs) {
        bufferRef.current = "";
      }
      lastKeyTimeRef.current = now;

      if (event.key === "Enter") {
        const candidate = bufferRef.current.trim();
        bufferRef.current = "";
        if (!candidate) return;

        event.preventDefault();
        if (STUDENT_CODE_REGEX.test(candidate)) {
          onScanRef.current(candidate);
        } else {
          onInvalidCodeRef.current?.(candidate);
        }
        return;
      }

      if (event.key.length === 1) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, maxCharIntervalMs]);
}
