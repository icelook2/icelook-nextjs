import type { Reroute } from "@sveltejs/kit";
import { deLocalizeUrl } from "$lib/paraglide/runtime";

// HINT: Taken from the integration documentation https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit#add-a-reroute-hook-in-srchooksts @ Roman
export const reroute: Reroute = (request) => {
  return deLocalizeUrl(request.url).pathname;
};
