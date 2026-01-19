"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface BottomNavVisibilityContextValue {
  /** Whether the bottom nav should be hidden */
  isHidden: boolean;
  /** Hide the bottom nav (call when entering booking focus mode) */
  hide: () => void;
  /** Show the bottom nav (call when exiting booking focus mode) */
  show: () => void;
}

const BottomNavVisibilityContext =
  createContext<BottomNavVisibilityContextValue | null>(null);

interface BottomNavVisibilityProviderProps {
  children: ReactNode;
}

export function BottomNavVisibilityProvider({
  children,
}: BottomNavVisibilityProviderProps) {
  const [isHidden, setIsHidden] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  const hide = () => {
    setIsHidden(true);
  };

  const show = () => {
    setIsHidden(false);
  };

  // Auto-show bottom nav when navigating to a different page
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setIsHidden(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <BottomNavVisibilityContext.Provider value={{ isHidden, hide, show }}>
      {children}
    </BottomNavVisibilityContext.Provider>
  );
}

/**
 * Hook to control bottom nav visibility.
 * Must be used within BottomNavVisibilityProvider.
 */
export function useBottomNavVisibility(): BottomNavVisibilityContextValue {
  const context = useContext(BottomNavVisibilityContext);
  if (!context) {
    throw new Error(
      "useBottomNavVisibility must be used within BottomNavVisibilityProvider",
    );
  }
  return context;
}

/**
 * Optional hook that returns null if not within provider.
 * Useful for components that may be used outside the provider.
 */
export function useBottomNavVisibilityOptional(): BottomNavVisibilityContextValue | null {
  return useContext(BottomNavVisibilityContext);
}
