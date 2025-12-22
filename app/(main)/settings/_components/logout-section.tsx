"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";

export function LogoutSection() {
 const t = useTranslations("settings");
 const [isPending, startTransition] = useTransition();

 function handleLogout() {
 startTransition(async () => {
 await signOut();
 });
 }

 return (
 <Paper>
 <div className="p-4">
 <Button
 variant="ghost"
 onClick={handleLogout}
 loading={isPending}
 className="w-full justify-center"
 >
 <LogOut className="mr-2 h-4 w-4" />
 {t("logout_button")}
 </Button>
 </div>
 </Paper>
 );
}
