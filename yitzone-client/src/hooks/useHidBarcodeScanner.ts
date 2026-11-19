import { useEffect, useRef } from "react";

const STUDENT_CODE_REGEX = /^[0-9]{8}$/;

interface UseHidBarcodeScannerOptions {
  enabled: boolean;
  maxCharIntervalMs?: number;
  onScan: (studentCode: string) => void;
  onInvalidCode?: (rawValue: string) => void;
}

/**
 * Scoped HID Barcode Wedge Hook (30-50ms/char) for physical Student ID cards (HLD 5.1, LLD 5.1.C, A24).
 * Active ONLY when mounted & enabled on ticket/store/office scanner screens.
 */
export function useHidBarcodeScanner({
  enabled,
  maxCharIntervalMs = 50,
  onScan,
  onInvalidCode
}: UseHidBarcodeScannerOptions): void {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = "";
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
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
          onScan(candidate);
        } else {
          onInvalidCode?.(candidate);
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
      bufferRef.current = "";
    };
  }, [enabled, maxCharIntervalMs, onInvalidCode, onScan]);
}
