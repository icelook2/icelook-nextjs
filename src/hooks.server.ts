import type { Theme } from "$lib/theme/theme-store.svelte";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.theme = (event.cookies.get("theme") as Theme) ?? "system";

  return resolve(event);
};
