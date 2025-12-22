"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
 const { setTheme, resolvedTheme } = useTheme();
 const [mounted, setMounted] = useState(false);

 // Prevent hydration mismatch by only rendering after mount
 useEffect(() => {
 setMounted(true);
 }, []);

 if (!mounted) {
 return (
 <button
 type="button"
 className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background"
 aria-label="Toggle theme"
 >
 <span className="sr-only">Toggle theme</span>
 </button>
 );
 }

 const isDark = resolvedTheme === "dark";

 return (
 <button
 type="button"
 onClick={() => setTheme(isDark ? "light" : "dark")}
 className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background transition-colors hover:bg-"
 aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
 >
 {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
 </button>
 );
}
