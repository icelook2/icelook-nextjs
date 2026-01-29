"use client";

import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  formatFileSize,
  getAllowedTypes,
  getMaxFileSize,
  validateImageFile,
} from "@/lib/storage/upload-avatar";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";
import { BeautyPagePreview } from "./previews/beauty-page-preview";
import { StepLayout } from "./step-layout";

interface StepAvatarProps {
  name: string;
  nickname: string;
  avatarFile: File | null;
  avatarPreviewUrl: string | null;
  totalSteps: number;
  onUpdate: (file: File | null, previewUrl: string | null) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

const gradients: string[] = [
  "from-blue-400 to-cyan-500",
  "from-red-400 to-pink-500",
  "from-green-400 to-emerald-500",
  "from-yellow-400 to-orange-500",
  "from-purple-400 to-indigo-500",
];

/**
 * Avatar step for the create beauty page flow.
 *
 * This step allows users to select an avatar image that will be uploaded
 * after the beauty page is created. The image is stored as a File object
 * and displayed as a preview using a blob URL.
 *
 * Features:
 * - Drag and drop support
 * - Click to select file
 * - File validation (type, size)
 * - Preview display
 * - Remove option
 * - Skip option (avatar is optional)
 */
export function StepAvatar({
  name,
  nickname,
  avatarFile,
  avatarPreviewUrl,
  totalSteps,
  onUpdate,
  onNext,
  onPrevious,
  onSkip,
}: StepAvatarProps) {
  const t = useTranslations("create_beauty_page");
  const tAvatarUpload = useTranslations("avatar_upload");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = name.charAt(0).toUpperCase();
  const gradientIndex = name.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

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
      setError(tAvatarUpload(validation.error));
      return;
    }

    // Revoke previous preview URL if exists
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    // Create preview and store file
    const objectUrl = URL.createObjectURL(file);
    onUpdate(file, objectUrl);
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

  function handleRemove() {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    onUpdate(null, null);
    setError(null);
  }

  function handleContinue() {
    onNext();
  }

  return (
    <StepLayout
      currentStep={3}
      totalSteps={totalSteps}
      title={t("avatar.title")}
      subtitle={t("avatar.subtitle")}
      previewLabel={t("preview.label")}
      preview={
        <BeautyPagePreview
          name={name}
          nickname={nickname}
          avatarPreviewUrl={avatarPreviewUrl}
        />
      }
      onBack={onPrevious}
    >
      <div className="flex flex-col items-center gap-6" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
        {/* Avatar container with remove button */}
        <div
          className="relative inline-block size-40"
          style={{
            position: "relative",
            display: "inline-block",
            width: "160px",
            height: "160px",
          }}
        >
          {/* Drop zone / Preview area */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-xl transition-all",
              isDragging
                ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                : "ring-1 ring-border hover:ring-accent",
            )}
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={getAllowedTypes().join(",")}
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Content */}
            {avatarPreviewUrl ? (
              <>
                <Image
                  src={avatarPreviewUrl}
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
          </button>

          {/* Remove button - top right corner */}
          {avatarFile && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-0 top-0 flex size-7 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-danger text-white shadow-md transition-transform hover:scale-110"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "28px",
                height: "28px",
                minWidth: "28px",
                minHeight: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9999px",
                transform: "translate(50%, -50%)",
              }}
              aria-label={tAvatarUpload("remove")}
            >
              <X className="size-4" style={{ width: "16px", height: "16px" }} />
            </button>
          )}
        </div>

        {/* Hint text */}
        <p className="text-center text-sm text-muted">
          {tAvatarUpload("hint", {
            formats: allowedExtensions,
            maxSize: maxSizeFormatted,
          })}
        </p>

        {/* Error message */}
        {error && <p className="text-center text-sm text-danger">{error}</p>}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex gap-3" style={{ marginTop: "2rem", display: "flex", gap: "0.75rem" }}>
        {avatarFile ? (
          <Button type="button" onClick={handleContinue}>
            {t("navigation.continue")}
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={onSkip}>
            {t("navigation.skip")}
          </Button>
        )}
      </div>
    </StepLayout>
  );
}
