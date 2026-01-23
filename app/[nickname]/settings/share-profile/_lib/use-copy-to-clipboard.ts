"use client";

import { useState } from "react";

type CopyStatus = "idle" | "copied" | "error";

/**
 * Hook for copying text to clipboard with status feedback.
 *
 * Returns the current status and a copy function.
 * Status auto-resets to "idle" after 2 seconds.
 */
export function useCopyToClipboard() {
  const [status, setStatus] = useState<CopyStatus>("idle");

  async function copy(text: string) {
    if (!navigator.clipboard) {
      setStatus("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");

      // Reset status after 2 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } catch {
      setStatus("error");
    }
  }

  return { copy, status };
}
