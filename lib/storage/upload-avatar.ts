import { createClient } from "@/lib/supabase/client";

// ============================================================================
// Constants
// ============================================================================

const BUCKET_NAME = "user-content";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// ============================================================================
// Types
// ============================================================================

export type AvatarTarget =
  | { type: "user" }
  | { type: "beauty-page"; beautyPageId: string };

type ValidationResult = { valid: true } | { valid: false; error: string };

type UploadResult =
  | { success: true; url: string }
  | { success: false; error: string };

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generates a unique filename for the avatar.
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().slice(0, 8);
  const extension = originalName.split(".").pop() || "jpg";
  return `${timestamp}_${randomId}.${extension}`;
}

/**
 * Builds the storage path for an avatar.
 *
 * Path structure:
 * - User avatar: {user_id}/avatar/{filename}
 * - Beauty page avatar: {user_id}/beauty-pages/{bp_id}/avatar/{filename}
 */
function buildStoragePath(
  userId: string,
  target: AvatarTarget,
  filename: string,
): string {
  if (target.type === "user") {
    return `${userId}/avatar/${filename}`;
  }
  return `${userId}/beauty-pages/${target.beautyPageId}/avatar/${filename}`;
}

/**
 * Gets the folder path for avatars (used for cleanup).
 */
function getAvatarFolderPath(userId: string, target: AvatarTarget): string {
  if (target.type === "user") {
    return `${userId}/avatar`;
  }
  return `${userId}/beauty-pages/${target.beautyPageId}/avatar`;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates an image file for avatar upload.
 * Checks file type and size on the client side.
 */
export function validateImageFile(file: File): ValidationResult {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return {
      valid: false,
      error: "invalid_file_type",
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "file_too_large",
    };
  }

  return { valid: true };
}

// ============================================================================
// Upload
// ============================================================================

/**
 * Uploads an avatar image directly to Supabase Storage.
 *
 * The image is uploaded as-is, and a database webhook triggers
 * background processing (resize, optimize) via Edge Function.
 */
export async function uploadAvatar(
  file: File,
  target: AvatarTarget,
): Promise<UploadResult> {
  // Client-side validation first
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "not_authenticated" };
  }

  const userId = user.id;
  const folderPath = getAvatarFolderPath(userId, target);

  // Delete existing avatar files first
  try {
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderPath);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${folderPath}/${f.name}`);
      await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
    }
  } catch {
    // Ignore errors during cleanup - folder might not exist yet
  }

  // Generate filename and path
  const filename = generateFilename(file.name);
  const storagePath = buildStoragePath(userId, target, filename);

  // Upload the file directly to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "upload_failed" };
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

  // Note: The database webhook will trigger background processing
  // which will resize/optimize the image and update the database.
  // For now, we return the URL of the original upload.

  return { success: true, url: publicUrl };
}

// ============================================================================
// Delete
// ============================================================================

/**
 * Deletes an avatar from Supabase Storage.
 * Used when removing an avatar without uploading a replacement.
 */
export async function deleteAvatar(
  target: AvatarTarget,
): Promise<UploadResult> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "not_authenticated" };
  }

  const userId = user.id;
  const folderPath = getAvatarFolderPath(userId, target);

  try {
    // List and delete all files in the avatar folder
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderPath);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${folderPath}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return { success: false, error: "delete_failed" };
      }
    }

    return { success: true, url: "" };
  } catch {
    return { success: false, error: "delete_failed" };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Returns the maximum allowed file size in bytes.
 */
export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}

/**
 * Returns the allowed MIME types for avatar uploads.
 */
export function getAllowedTypes(): readonly string[] {
  return ALLOWED_TYPES;
}

/**
 * Formats file size for display (e.g., "5 MB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
