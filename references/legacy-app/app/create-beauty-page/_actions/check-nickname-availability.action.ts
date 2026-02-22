"use server";

import { createClient } from "@/lib/supabase/server";
import { beautyPageSlugSchema, RESERVED_SLUGS } from "@/lib/validation/schemas";

type CheckNicknameResult =
  | { available: true }
  | { available: false; error?: string; suggestions?: string[] };

/**
 * Generate candidate nicknames for suggestions.
 * Uses tiered approach: structural variations, meaningful numbers, random numbers.
 */
function generateCandidates(base: string): string[] {
  const candidates: string[] = [];
  const currentYear = new Date().getFullYear();

  // Tier 1: Structural variations
  if (base.includes("-")) {
    // Try without dashes
    candidates.push(base.replace(/-/g, ""));
  } else {
    // Try adding dash before last word-like segment
    const match = base.match(/^(.+?)(\d*)$/);
    if (match && match[1].length > 3) {
      // Don't add dash variations for short bases
    }
  }

  // Tier 2: Year-based (meaningful)
  candidates.push(`${base}${currentYear}`);
  candidates.push(`${base}${currentYear.toString().slice(-2)}`);

  // Tier 2: Sequential numbers (1-9)
  for (let i = 1; i <= 9; i++) {
    candidates.push(`${base}${i}`);
  }

  // Tier 3: Random 3-digit numbers (high availability)
  for (let i = 0; i < 15; i++) {
    const rand = Math.floor(Math.random() * 900) + 100; // 100-999
    candidates.push(`${base}${rand}`);
  }

  // Clean, validate, and dedupe
  return [...new Set(candidates)]
    .map((c) => c.toLowerCase().slice(0, 30))
    .filter((c) => {
      const validation = beautyPageSlugSchema.safeParse(c);
      return validation.success;
    })
    .filter((c) => !RESERVED_SLUGS.includes(c as (typeof RESERVED_SLUGS)[number]));
}

/**
 * Get available nickname suggestions when the desired one is taken.
 * Single batch query for efficiency.
 */
async function getAvailableSuggestions(
  base: string,
  maxSuggestions = 3,
): Promise<string[]> {
  const candidates = generateCandidates(base);

  if (candidates.length === 0) {
    return [];
  }

  const supabase = await createClient();

  // Batch check all candidates in one query
  const { data: takenPages } = await supabase
    .from("beauty_pages")
    .select("slug")
    .in("slug", candidates);

  const takenSet = new Set(takenPages?.map((p) => p.slug) || []);

  // Filter to available and return first N
  return candidates.filter((c) => !takenSet.has(c)).slice(0, maxSuggestions);
}

/**
 * Check if a nickname (slug) is available for use.
 * Validates format, checks database, and returns suggestions if taken.
 */
export async function checkNicknameAvailability(
  nickname: string,
): Promise<CheckNicknameResult> {
  // Validate format
  const formatValidation = beautyPageSlugSchema.safeParse(nickname);
  if (!formatValidation.success) {
    return { available: false, error: "invalid_format" };
  }

  // Check reserved slugs
  if (RESERVED_SLUGS.includes(nickname as (typeof RESERVED_SLUGS)[number])) {
    return { available: false, error: "reserved" };
  }

  // Check database
  const supabase = await createClient();

  const { data: existingPage } = await supabase
    .from("beauty_pages")
    .select("id")
    .eq("slug", nickname)
    .single();

  if (existingPage) {
    // Nickname is taken - get suggestions
    const suggestions = await getAvailableSuggestions(nickname);
    return { available: false, error: "taken", suggestions };
  }

  return { available: true };
}
