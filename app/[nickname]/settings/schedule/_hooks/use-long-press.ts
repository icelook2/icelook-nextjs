"use client";

import { useCallback, useRef, useState } from "react";

interface UseLongPressOptions {
  /** Time in ms before long-press triggers (default: 500ms) */
  threshold?: number;
  /** Called when long-press is detected */
  onLongPress: (position: { x: number; y: number }) => void;
  /** Called on short tap (click) */
  onTap?: () => void;
  /** Called when drag starts after long-press */
  onDragStart?: (position: { x: number; y: number }) => void;
  /** Movement threshold to cancel long-press (default: 10px) */
  moveThreshold?: number;
}

interface UseLongPressReturn {
  /** Handlers to spread on the element */
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
  };
  /** Whether currently pressing (before long-press threshold) */
  isPressing: boolean;
  /** Whether long-press has been triggered */
  isLongPressed: boolean;
}

/**
 * Hook for detecting long-press on touch devices
 * Differentiates between tap (click) and long-press to initiate drag
 */
export function useLongPress({
  threshold = 500,
  onLongPress,
  onTap,
  onDragStart,
  moveThreshold = 10,
}: UseLongPressOptions): UseLongPressReturn {
  const [isPressing, setIsPressing] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isMouseRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setIsPressing(false);
    setIsLongPressed(false);
    startPosRef.current = null;
    isMouseRef.current = false;
  }, [clearTimer]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore right-click
      if (e.button !== 0) return;

      const position = { x: e.clientX, y: e.clientY };
      startPosRef.current = position;
      isMouseRef.current = e.pointerType === "mouse";

      // Mouse: Trigger drag start immediately (no long-press needed)
      if (e.pointerType === "mouse") {
        setIsPressing(true);
        setIsLongPressed(true);
        onLongPress(position);
        onDragStart?.(position);
        return;
      }

      // Touch: Start long-press timer
      setIsPressing(true);

      timerRef.current = setTimeout(() => {
        setIsLongPressed(true);
        onLongPress(position);

        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, threshold);
    },
    [threshold, onLongPress, onDragStart],
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      // For touch: if not long-pressed, it's a tap
      if (!isMouseRef.current && isPressing && !isLongPressed) {
        onTap?.();
      }

      reset();
    },
    [isPressing, isLongPressed, onTap, reset],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current) return;

      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);

      // If moved too much before long-press, cancel the timer
      if (dx > moveThreshold || dy > moveThreshold) {
        if (!isLongPressed) {
          clearTimer();
          setIsPressing(false);
        } else if (!isMouseRef.current) {
          // Touch + long-pressed + moved = drag started
          onDragStart?.({ x: e.clientX, y: e.clientY });
        }
      }
    },
    [moveThreshold, isLongPressed, clearTimer, onDragStart],
  );

  const handlePointerCancel = useCallback(() => {
    reset();
  }, [reset]);

  const handlePointerLeave = useCallback(() => {
    // Only reset if not in drag mode
    if (!isLongPressed) {
      reset();
    }
  }, [isLongPressed, reset]);

  return {
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerMove: handlePointerMove,
      onPointerCancel: handlePointerCancel,
      onPointerLeave: handlePointerLeave,
    },
    isPressing,
    isLongPressed,
  };
}
