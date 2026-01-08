"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { Button } from "@/lib/ui/button";

interface AppointmentsPaginationProps {
  currentPage: number;
  totalPages: number;
}

/**
 * Generate page numbers with ellipsis for pagination
 * Example: [1, 2, '...', 5, 6, 7, '...', 10]
 */
function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  if (currentPage > 3) {
    pages.push("...");
  }

  // Show pages around current
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("...");
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export function AppointmentsPagination({
  currentPage,
  totalPages,
}: AppointmentsPaginationProps) {
  const t = useTranslations("clients.service_detail");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", page.toString());
      }

      router.push(`?${params.toString()}`);
    },
    [router, searchParams, totalPages],
  );

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  return (
    <div className="flex items-center justify-between">
      {/* Page info */}
      <span className="text-sm text-muted">
        {t("pagination.page", { current: currentPage, total: totalPages })}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">{t("pagination.prev")}</span>
        </Button>

        {/* Page numbers */}
        {pageNumbers.map((page, idx) => {
          if (page === "...") {
            // Use position-based key: first ellipsis is "start", second is "end"
            const ellipsisKey = idx <= 2 ? "ellipsis-start" : "ellipsis-end";
            return (
              <span key={ellipsisKey} className="px-2 text-sm text-muted">
                ...
              </span>
            );
          }
          return (
            <Button
              key={page}
              variant={page === currentPage ? "primary" : "ghost"}
              size="sm"
              onClick={() => handlePageChange(page)}
              className="h-8 w-8 p-0"
            >
              {page}
            </Button>
          );
        })}

        {/* Next button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">{t("pagination.next")}</span>
        </Button>
      </div>
    </div>
  );
}
