"use client";

import { useEffect, type ReactNode } from "react";

interface CreateBeautyPageLayoutProps {
  children: ReactNode;
}

export default function CreateBeautyPageLayout({
  children,
}: CreateBeautyPageLayoutProps) {
  useEffect(() => {
    document.body.classList.add("create-beauty-page");
    return () => {
      document.body.classList.remove("create-beauty-page");
    };
  }, []);

  return children;
}
