import { cn } from "@/lib/utils/cn";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex-col bg-background",
        "w-16 lg:w-64",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-3 lg:px-4">
        <Logo collapsed className="lg:hidden" />
        <Logo className="hidden lg:flex" />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-3">
        <SidebarNav collapsed className="lg:hidden" />
        <SidebarNav className="hidden lg:flex" />
      </div>
    </aside>
  );
}
