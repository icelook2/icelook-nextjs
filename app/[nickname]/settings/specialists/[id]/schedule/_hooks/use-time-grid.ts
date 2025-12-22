"use client";

import { useMemo } from "react";
import {
  calculateGridHeight,
  durationToPixels,
  generateTimeSlots,
  timeToPixels,
} from "../_lib/time-utils";
import { DEFAULT_GRID_CONFIG, type GridConfig } from "../_lib/types";

interface UseTimeGridOptions {
  config?: Partial<GridConfig>;
}

/**
 * Hook for managing time grid calculations
 * Provides time slots and positioning utilities
 */
export function useTimeGrid(options: UseTimeGridOptions = {}) {
  const config: GridConfig = useMemo(
    () => ({
      ...DEFAULT_GRID_CONFIG,
      ...options.config,
    }),
    [options.config],
  );

  // Generate time slots for display
  const timeSlots = useMemo(() => generateTimeSlots(config), [config]);

  // Calculate total grid height
  const gridHeight = useMemo(() => calculateGridHeight(config), [config]);

  // Utility function to get pixel position for a time
  const getTimePosition = useMemo(
    () => (time: string) => timeToPixels(time, config),
    [config],
  );

  // Utility function to get block height for a time range
  const getBlockHeight = useMemo(
    () => (startTime: string, endTime: string) =>
      durationToPixels(startTime, endTime, config.pixelsPerHour),
    [config.pixelsPerHour],
  );

  return {
    config,
    timeSlots,
    gridHeight,
    getTimePosition,
    getBlockHeight,
  };
}
