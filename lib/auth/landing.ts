import { getActiveBeautyPageId } from "@/lib/beauty-page/active-beauty-page";
import { getUserBeautyPages, type UserBeautyPage } from "@/lib/queries/beauty-pages";

function pickDefaultBeautyPage(
  beautyPages: UserBeautyPage[],
  activeBeautyPageId: string | null,
): UserBeautyPage | null {
  if (beautyPages.length === 0) {
    return null;
  }

  if (activeBeautyPageId) {
    const activeBeautyPage = beautyPages.find((beautyPage) => beautyPage.id === activeBeautyPageId);
    if (activeBeautyPage) {
      return activeBeautyPage;
    }
  }

  return beautyPages[0] ?? null;
}

/**
 * Specialist-first policy:
 * - Specialist (has beauty pages): /{slug}/appointments
 * - Client-only: /appointments
 */
export async function resolvePostLoginDestination(userId: string): Promise<string> {
  const [beautyPages, activeBeautyPageId] = await Promise.all([
    getUserBeautyPages(userId),
    getActiveBeautyPageId(),
  ]);

  const defaultBeautyPage = pickDefaultBeautyPage(beautyPages, activeBeautyPageId);

  if (defaultBeautyPage) {
    return `/${defaultBeautyPage.slug}/appointments`;
  }

  return "/appointments";
}
