"use client";

import { cn } from "@/lib/utils/cn";
import { useRef } from "react";
import { ScheduleDragProvider } from "../_context";
import { useHorizontalScroll, useTimeGrid } from "../_hooks";
import type { Appointment, WorkingDayWithBreaks } from "../_lib/types";
import { DayColumn } from "./day-column";
import { ScrollIndicators } from "./scroll-indicators";
import { TimeColumn } from "./time-column";
import { TimelineHeader } from "./timeline-header";

/** Minimum width for each day column to ensure comfortable touch targets */
const MIN_DAY_WIDTH = 120;

interface TimelineGridProps {
  dates: Date[];
  workingDays: WorkingDayWithBreaks[];
  appointments: Appointment[];
  beautyPageId: string;
  nickname: string;
  canManage: boolean;
  onAddWorkingDay?: (date: string) => void;
  onEditWorkingDay?: (workingDay: WorkingDayWithBreaks) => void;
  onEditBreak?: (breakData: WorkingDayWithBreaks["breaks"][number]) => void;
  /** Callback when an appointment is rescheduled via drag */
  onReschedule?: (result: {
    appointmentId: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
  }) => void;
  className?: string;
}

/**
 * Main timeline grid component
 * Combines header, time column, and day columns
 * Supports horizontal scrolling with snap on smaller screens
 */
export function TimelineGrid({
  dates,
  workingDays,
  appointments,
  beautyPageId,
  nickname,
  canManage,
  onAddWorkingDay,
  onEditWorkingDay,
  onEditBreak,
  onReschedule,
  className,
}: TimelineGridProps) {
  const { config, timeSlots, gridHeight } = useTimeGrid();
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    scrollRef,
    currentIndex,
    canScrollLeft,
    canScrollRight,
    isScrollable,
    scrollToIndex,
  } = useHorizontalScroll({
    itemCount: dates.length,
    minItemWidth: MIN_DAY_WIDTH,
  });

  // Calculate minimum width for the scrollable content
  const minContentWidth = dates.length * MIN_DAY_WIDTH;

  return (
    <ScheduleDragProvider
      dates={dates}
      appointments={appointments}
      workingDays={workingDays}
      config={config}
      gridRef={gridRef}
      onDragComplete={onReschedule}
    >
      <div className={cn("flex flex-col", className)}>
        {/* Main grid area with time column and scrollable day columns */}
        <div className="flex">
          {/* Time column - stays fixed on the left */}
          <div className="flex shrink-0 flex-col">
            {/* Header spacer for time column */}
            <div className="h-[72px] w-16 border-b border-border bg-background" />

            {/* Time labels */}
            <div className="relative w-16" style={{ height: gridHeight }}>
              <TimeColumn timeSlots={timeSlots} />
            </div>
          </div>

          {/* Scrollable area for header and day columns */}
          <div
            ref={scrollRef}
            className="scrollbar-hide flex-1 overflow-x-auto scroll-smooth snap-x snap-mandatory"
          >
            {/* Inner container with minimum width for scrolling */}
            <div style={{ minWidth: minContentWidth }}>
              {/* Header with day names - sticky top */}
              <TimelineHeader
                dates={dates}
                workingDays={workingDays}
                canManage={canManage}
                onAddWorkingDay={onAddWorkingDay}
                onEditWorkingDay={onEditWorkingDay}
              />

              {/* Day columns - ref for drag position calculations */}
              <div ref={gridRef} className="flex" style={{ height: gridHeight }}>
                {dates.map((date) => (
                  <DayColumn
                    key={date.toISOString()}
                    date={date}
                    workingDays={workingDays}
                    appointments={appointments}
                    config={config}
                    beautyPageId={beautyPageId}
                    nickname={nickname}
                    canManage={canManage}
                    onEditBreak={onEditBreak}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicators - only show when scrollable */}
        {isScrollable && (
          <ScrollIndicators
            currentIndex={currentIndex}
            totalCount={dates.length}
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScrollToIndex={scrollToIndex}
          />
        )}
      </div>
    </ScheduleDragProvider>
  );
}
