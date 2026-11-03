import { useEffect, useRef, useState, useCallback } from "react";
import { sound } from "@/lib/sound";

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void | Promise<void>;
  minChars?: number;
  maxIntervalMs?: number;
  playSound?: boolean;
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minChars = 3,
  maxIntervalMs = 50,
  playSound = true,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);

  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const now = performance.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Check if user is typing in standard inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Special case: Barcode input field
      const isBarcodeInput = target.getAttribute("data-barcode-input") === "true";

      // If key is Enter, evaluate accumulated buffer
      if (e.key === "Enter") {
        if (bufferRef.current.length >= minChars) {
          const barcode = bufferRef.current.join("").trim();
          bufferRef.current = [];
          if (barcode.length >= minChars) {
            e.preventDefault();
            e.stopPropagation();
            if (playSound) {
              sound.scan();
            }
            setLastScanned(barcode);
            setScanCount((prev) => prev + 1);
            onScanRef.current(barcode);
            return;
          }
        }
        bufferRef.current = [];
        return;
      }

      // If key is a printable character (length 1)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // If keystrokes are coming fast (< maxIntervalMs) or buffer has started fast
        if (timeDiff <= maxIntervalMs || bufferRef.current.length === 0) {
          if (timeDiff > maxIntervalMs && bufferRef.current.length > 0) {
            // reset if human typing pause
            bufferRef.current = [];
          }
          bufferRef.current.push(e.key);
        } else {
          // If human typing slowly inside another input, don't capture unless it's designated barcode
          if (!isInput || isBarcodeInput) {
            bufferRef.current = [e.key];
          } else {
            bufferRef.current = [];
          }
        }
      }
    },
    [enabled, minChars, maxIntervalMs, playSound]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [handleKeyDown]);

  const toggleScanner = () => {
    setIsScanningActive((prev) => !prev);
  };

  return {
    lastScanned,
    scanCount,
    isScanningActive,
    toggleScanner,
  };
}
