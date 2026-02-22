import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/lib/ui/page-header";
import { SearchContainer } from "./_components";

export default async function SearchPage() {
  const t = await getTranslations("search");

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pt-1">
        <SearchContainer />
      </div>
    </>
  );
}
