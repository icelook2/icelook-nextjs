"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseHorizontalScrollOptions {
  /** Number of items in the scrollable area */
  itemCount: number;
  /** Minimum width of each item in pixels */
  minItemWidth?: number;
  /** Callback when scroll ends on a specific index */
  onScrollEnd?: (index: number) => void;
}

interface UseHorizontalScrollReturn {
  /** Ref to attach to the scroll container */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Current visible item index (0-based) */
  currentIndex: number;
  /** Whether there is content to scroll left */
  canScrollLeft: boolean;
  /** Whether there is content to scroll right */
  canScrollRight: boolean;
  /** Scroll to a specific item index */
  scrollToIndex: (index: number) => void;
  /** Scroll one item to the left */
  scrollLeft: () => void;
  /** Scroll one item to the right */
  scrollRight: () => void;
  /** Whether scrolling is needed (content wider than container) */
  isScrollable: boolean;
}

/**
 * Hook for managing horizontal scroll with snap behavior
 * Tracks scroll position, calculates current visible item, provides navigation
 */
export function useHorizontalScroll({
  itemCount,
  minItemWidth = 120,
  onScrollEnd,
}: UseHorizontalScrollOptions): UseHorizontalScrollReturn {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // Calculate item width based on container
  const getItemWidth = useCallback(() => {
    if (!scrollRef.current) return minItemWidth;
    const containerWidth = scrollRef.current.clientWidth;
    const calculatedWidth = containerWidth / itemCount;
    return Math.max(calculatedWidth, minItemWidth);
  }, [itemCount, minItemWidth]);

  // Update scroll state based on current position
  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const itemWidth = getItemWidth();

    // Calculate current index based on scroll position
    const newIndex = Math.round(scrollLeft / itemWidth);
    setCurrentIndex(Math.min(newIndex, itemCount - 1));

    // Update scroll indicators
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    setIsScrollable(scrollWidth > clientWidth);
  }, [getItemWidth, itemCount]);

  // Scroll to a specific index
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      if (!container) return;

      const itemWidth = getItemWidth();
      const targetScroll = index * itemWidth;

      container.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    },
    [getItemWidth],
  );

  // Scroll one item left
  const scrollLeft = useCallback(() => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex]);

  // Scroll one item right
  const scrollRight = useCallback(() => {
    if (currentIndex < itemCount - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, itemCount, scrollToIndex]);

  // Set up scroll event listener
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollEndTimer: ReturnType<typeof setTimeout>;

    function handleScroll() {
      updateScrollState();

      // Debounce scroll end callback
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        if (!container) return;
        const itemWidth = getItemWidth();
        const newIndex = Math.round(container.scrollLeft / itemWidth);
        onScrollEnd?.(Math.min(newIndex, itemCount - 1));
      }, 150);
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollState(); // Initial state

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollEndTimer);
    };
  }, [updateScrollState, getItemWidth, itemCount, onScrollEnd]);

  // Update state on resize
  useEffect(() => {
    function handleResize() {
      updateScrollState();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState]);

  return {
    scrollRef,
    currentIndex,
    canScrollLeft,
    canScrollRight,
    scrollToIndex,
    scrollLeft,
    scrollRight,
    isScrollable,
  };
}
