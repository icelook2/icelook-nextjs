"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { mainNavItems } from "./nav-config";
import { NavItem } from "./nav-item";

interface SidebarNavProps {
 className?: string;
 beautyPagesCount?: number;
}

export function SidebarNav({
 className,
 beautyPagesCount = 0,
}: SidebarNavProps) {
 const t = useTranslations();

 const visibleItems = useMemo(() => {
 return mainNavItems.filter((item) => {
 if (item.requiresBeautyPages) {
 return beautyPagesCount > 0;
 }
 return true;
 });
 }, [beautyPagesCount]);

 return (
 <div className={cn("flex flex-col gap-4", className)}>
 {visibleItems.map((item) => (
 <NavItem
 key={item.href}
 href={item.href}
 icon={item.icon}
 label={t(item.labelKey)}
 />
 ))}
 </div>
 );
}
