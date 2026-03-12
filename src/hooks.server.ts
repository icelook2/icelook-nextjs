import type { Theme, AccentColor } from "$lib/theme/theme-store.svelte";
import { redirect, type Handle } from "@sveltejs/kit";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { getTextDirection } from "$lib/paraglide/runtime";
import { sequence } from "@sveltejs/kit/hooks";
import { authClient } from "$lib/auth-client";

const authHandler: Handle = async ({ event, resolve }) => {
  const { data, error } = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: event.request.headers.get("cookie") ?? "",
      },
    },
  });

  // HINT: Do not allow authenticated users to navigate to guest only pages @ Roman
  if (data?.session && event.route.id?.startsWith("/(auth)")) {
    throw redirect(303, "/");
  }

  // HINT: Do not allow guest users to navigate to authenticated only pages @ Roman
  if (!data?.session && event.route.id?.startsWith("/(main)")) {
    throw redirect(303, "/sign-in");
  }

  event.locals.auth = {
    session: data?.session ?? null,
    user: data?.user ?? null,
  };

  return resolve(event);
};

const themeHandle: Handle = async ({ event, resolve }) => {
  event.locals.theme = (event.cookies.get("theme") as Theme) ?? "system";
  event.locals.accent = (event.cookies.get("accent") as AccentColor) ?? "blue";

  return resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace("%accent%", event.locals.accent),
  });
};

// HINT: Taken from the integration documentation https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit#add-the-paraglidemiddleware-to-srchooksserverts @ Roman
const paraglideHandle: Handle = ({ event, resolve }) =>
  paraglideMiddleware(
    event.request,
    ({ request: localizedRequest, locale }) => {
      event.request = localizedRequest;
      return resolve(event, {
        transformPageChunk: ({ html }) => {
          return html
            .replace("%lang%", locale)
            .replace("%dir%", getTextDirection(locale));
        },
      });
    },
  );

export const handle: Handle = sequence(
  themeHandle,
  paraglideHandle,
  authHandler,
);
