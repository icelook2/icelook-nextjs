import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export type SpecialistLabel = Tables<"specialist_labels">;

export type SpecialistLabelAssignment = Tables<"specialist_label_assignments">;

/** Label with assignment info for display */
export type LabelWithAssignmentCount = SpecialistLabel & {
  assignment_count: number;
};

/** Specialist with their assigned labels */
export type SpecialistLabels = {
  specialist_id: string;
  labels: SpecialistLabel[];
};

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetches all labels for a beauty page
 */
export async function getBeautyPageLabels(
  beautyPageId: string,
): Promise<SpecialistLabel[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("specialist_labels")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching specialist labels:", {
      message: error.message,
      code: error.code,
      beautyPageId,
    });
    return [];
  }

  return data ?? [];
}

/**
 * Fetches all labels for a beauty page with assignment counts
 */
export async function getBeautyPageLabelsWithCounts(
  beautyPageId: string,
): Promise<LabelWithAssignmentCount[]> {
  const supabase = await createClient();

  // Fetch labels
  const { data: labels, error: labelsError } = await supabase
    .from("specialist_labels")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (labelsError) {
    console.error("Error fetching specialist labels:", {
      message: labelsError.message,
      code: labelsError.code,
      beautyPageId,
    });
    return [];
  }

  if (!labels || labels.length === 0) {
    return [];
  }

  // Fetch assignment counts
  const labelIds = labels.map((l) => l.id);
  const { data: assignments, error: assignmentsError } = await supabase
    .from("specialist_label_assignments")
    .select("label_id")
    .in("label_id", labelIds);

  if (assignmentsError) {
    console.error("Error fetching label assignments:", {
      message: assignmentsError.message,
      code: assignmentsError.code,
    });
    // Return labels without counts on error
    return labels.map((label) => ({
      ...label,
      assignment_count: 0,
    }));
  }

  // Count assignments per label
  const countByLabel = new Map<string, number>();
  for (const assignment of assignments ?? []) {
    const count = countByLabel.get(assignment.label_id) ?? 0;
    countByLabel.set(assignment.label_id, count + 1);
  }

  return labels.map((label) => ({
    ...label,
    assignment_count: countByLabel.get(label.id) ?? 0,
  }));
}

/**
 * Fetches a single label by ID
 */
export async function getLabelById(
  labelId: string,
): Promise<SpecialistLabel | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("specialist_labels")
    .select("*")
    .eq("id", labelId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching label:", {
      message: error.message,
      code: error.code,
      labelId,
    });
    return null;
  }

  return data;
}

/**
 * Fetches labels assigned to a specific specialist
 */
export async function getSpecialistLabels(
  specialistId: string,
): Promise<SpecialistLabel[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("specialist_label_assignments")
    .select("specialist_labels (*)")
    .eq("specialist_id", specialistId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching specialist labels:", {
      message: error.message,
      code: error.code,
      specialistId,
    });
    return [];
  }

  // Extract labels from the nested structure
  // The select returns specialist_labels as a single object (not array) due to the foreign key relationship
  const labels = (data ?? [])
    .map((assignment) => assignment.specialist_labels as unknown as SpecialistLabel | null)
    .filter((label): label is SpecialistLabel => label !== null);

  return labels.sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
}

/**
 * Fetches labels for multiple specialists in bulk (optimized for profile page)
 * Returns a Map of specialist_id -> labels[]
 */
export async function getBulkSpecialistLabels(
  specialistIds: string[],
): Promise<Map<string, SpecialistLabel[]>> {
  if (specialistIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("specialist_label_assignments")
    .select("specialist_id, specialist_labels (*)")
    .in("specialist_id", specialistIds);

  if (error) {
    console.error("Error fetching bulk specialist labels:", {
      message: error.message,
      code: error.code,
    });
    return new Map();
  }

  // Group labels by specialist
  const labelsBySpecialist = new Map<string, SpecialistLabel[]>();

  for (const assignment of data ?? []) {
    const label = assignment.specialist_labels as unknown as SpecialistLabel;
    if (!label) {
      continue;
    }

    const existing = labelsBySpecialist.get(assignment.specialist_id) ?? [];
    existing.push(label);
    labelsBySpecialist.set(assignment.specialist_id, existing);
  }

  // Sort labels for each specialist
  for (const [specialistId, labels] of labelsBySpecialist) {
    labels.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    labelsBySpecialist.set(specialistId, labels);
  }

  return labelsBySpecialist;
}

/**
 * Gets the label IDs assigned to a specialist (for form checkboxes)
 */
export async function getSpecialistLabelIds(
  specialistId: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("specialist_label_assignments")
    .select("label_id")
    .eq("specialist_id", specialistId);

  if (error) {
    console.error("Error fetching specialist label IDs:", {
      message: error.message,
      code: error.code,
      specialistId,
    });
    return [];
  }

  return (data ?? []).map((assignment) => assignment.label_id);
}
