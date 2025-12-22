"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/lib/ui/button";

interface DateNavigatorProps {
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

/**
 * Navigation buttons for moving between date ranges
 */
export function DateNavigator({
  onPrevious,
  onNext,
  onToday,
}: DateNavigatorProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        aria-label="Previous"
        className="aspect-square p-2"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button variant="secondary" size="sm" onClick={onToday}>
        Today
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        aria-label="Next"
        className="aspect-square p-2"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
