import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
 const t = await getTranslations("not_found");

 return (
 <div className="flex min-h-screen items-center justify-center">
 <div className="text-center">
 <h1 className="text-6xl font-bold">
 {t("code")}
 </h1>
 <p className=" mt-4 text-lg">
 {t("title")}
 </p>
 <Link
 href="/"
 className="mt-6 inline-block transition-colors"
 >
 {t("go_home")}
 </Link>
 </div>
 </div>
 );
}
