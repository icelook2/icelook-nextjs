"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type HeaderPortalProps = {
  children: ReactNode;
};

/**
 * Portal wrapper for the fixed header.
 * Renders the header to the end of document.body so it paints last
 * and appears on top of all other content without z-index.
 */
export function HeaderPortal({ children }: HeaderPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // SSR fallback - render inline
    return <>{children}</>;
  }

  return createPortal(children, document.body);
}
