"use client";

import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  type AvatarTarget,
  formatFileSize,
  getAllowedTypes,
  getMaxFileSize,
  uploadAvatar,
  validateImageFile,
} from "@/lib/storage/upload-avatar";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

// ============================================================================
// Types
// ============================================================================

interface AvatarUploadProps {
  /** Current avatar URL */
  currentUrl: string | null;
  /** Fallback name for avatar placeholder */
  name: string;
  /** Upload target configuration */
  target: AvatarTarget;
  /** Callback when upload succeeds */
  onUploadSuccess: (url: string) => void;
  /** Callback when avatar is removed */
  onRemove?: () => void;
  /** Whether remove is allowed */
  allowRemove?: boolean;
  /** Shape of the avatar preview */
  shape?: "circle" | "rounded";
}

// ============================================================================
// Constants
// ============================================================================

const gradients: string[] = [
  "from-blue-400 to-cyan-500",
  "from-red-400 to-pink-500",
  "from-green-400 to-emerald-500",
  "from-yellow-400 to-orange-500",
  "from-purple-400 to-indigo-500",
];

// ============================================================================
// Component
// ============================================================================

export function AvatarUpload({
  currentUrl,
  name,
  target,
  onUploadSuccess,
  onRemove,
  allowRemove = true,
  shape = "circle",
}: AvatarUploadProps) {
  const t = useTranslations("avatar_upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = previewUrl || currentUrl;
  const initial = name.charAt(0).toUpperCase();
  const gradientIndex = name.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  // Format allowed types for display
  const allowedExtensions = getAllowedTypes()
    .map((type) => type.split("/")[1].toUpperCase())
    .join(", ");
  const maxSizeFormatted = formatFileSize(getMaxFileSize());

  function handleFileSelect(file: File) {
    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(t(validation.error));
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    event.target.value = "";
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  function handleCancelSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
  }

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setError(null);

    const result = await uploadAvatar(selectedFile, target);

    setIsUploading(false);

    if (result.success) {
      // Clean up preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      onUploadSuccess(result.url);
    } else {
      setError(t(result.error));
    }
  }

  function handleRemove() {
    handleCancelSelection();
    onRemove?.();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Drop zone / Preview area */}
      <button
        type="button"
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex size-40 cursor-pointer items-center justify-center overflow-hidden transition-all",
          shapeClass,
          isDragging
            ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
            : "ring-1 ring-border hover:ring-accent",
          isUploading && "cursor-not-allowed opacity-70",
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={getAllowedTypes().join(",")}
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {/* Content */}
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="160px"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <Camera className="size-8 text-white" />
            </div>
          </>
        ) : (
          <div
            className={cn(
              "flex size-full flex-col items-center justify-center bg-gradient-to-br text-white",
              gradient,
            )}
          >
            {isDragging ? (
              <Upload className="size-10" />
            ) : (
              <>
                <span className="text-5xl font-semibold">{initial}</span>
                <Camera className="mt-2 size-6 opacity-70" />
              </>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="size-8 animate-spin text-white" />
          </div>
        )}
      </button>

      {/* Hint text */}
      <p className="text-center text-sm text-muted">
        {t("hint", { formats: allowedExtensions, maxSize: maxSizeFormatted })}
      </p>

      {/* Error message */}
      {error && <p className="text-center text-sm text-danger">{error}</p>}

      {/* Action buttons */}
      <div className="flex gap-2">
        {selectedFile ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelSelection}
              disabled={isUploading}
            >
              {t("cancel")}
            </Button>
            <Button type="button" onClick={handleUpload} loading={isUploading}>
              {isUploading ? t("uploading") : t("upload")}
            </Button>
          </>
        ) : (
          allowRemove &&
          currentUrl &&
          onRemove && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <Trash2 className="mr-2 size-4" />
              {t("remove")}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
