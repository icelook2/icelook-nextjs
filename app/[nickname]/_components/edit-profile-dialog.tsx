"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AvatarUpload } from "@/lib/ui/avatar-upload";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import {
  createTranslatedBeautyPageNameSchema,
  createTranslatedBeautyPageSlugSchema,
} from "@/lib/validation/schemas";
import { updateBeautyPageProfile } from "../_actions/update-beauty-page-profile.action";

// ============================================================================
// Types
// ============================================================================

type EditView = "menu" | "avatar" | "name" | "slug" | "bio";

interface EditProfileDialogProps {
  beautyPageId: string;
  currentName: string;
  currentSlug: string;
  currentBio: string | null;
  currentAvatarUrl: string | null;
  slugChangedAt: string | null;
  translations: {
    editProfile: string;
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    slugLabel: string;
    slugPlaceholder: string;
    slugHint: string;
    slugCooldownWarning: string;
    slugChangeWarning: string;
    bioLabel: string;
    bioPlaceholder: string;
    bioHint: string;
    cancel: string;
    save: string;
    saving: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

const SLUG_COOLDOWN_DAYS = 30;
const BIO_MAX_LENGTH = 500;

// Animation variants
const slideVariants = {
  enterFromRight: { x: 20, opacity: 0 },
  enterFromLeft: { x: -20, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitToLeft: { x: -20, opacity: 0 },
  exitToRight: { x: 20, opacity: 0 },
};

// ============================================================================
// Menu Item Component
// ============================================================================

interface MenuItemProps {
  label: string;
  value: string | null;
  placeholder?: string;
  onClick: () => void;
  disabled?: boolean;
  locked?: boolean;
}

function MenuItem({
  label,
  value,
  placeholder,
  onClick,
  disabled,
  locked,
}: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="flex items-center gap-1.5 truncate text-sm text-muted">
          {locked && <Lock className="size-3.5 shrink-0" />}
          <span className="truncate">{value || placeholder}</span>
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted" />
    </button>
  );
}

// ============================================================================
// Edit Name View
// ============================================================================

interface EditNameViewProps {
  beautyPageId: string;
  currentName: string;
  translations: EditProfileDialogProps["translations"];
  onSuccess: (newName: string) => void;
}

function EditNameView({
  beautyPageId,
  currentName,
  translations,
  onSuccess,
}: EditNameViewProps) {
  const tValidation = useTranslations("validation");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const nameSchema = createTranslatedBeautyPageNameSchema((key) =>
    tValidation(key),
  );
  const formSchema = z.object({ name: nameSchema });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: currentName },
  });

  function onSubmit(data: { name: string }) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateBeautyPageProfile({
        beautyPageId,
        name: data.name,
      });
      if (result.success) {
        onSuccess(data.name);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      <Field.Root>
        <Input
          type="text"
          placeholder={translations.namePlaceholder}
          state={errors.name ? "error" : "default"}
          autoFocus
          {...register("name")}
        />
        <Field.Error>{errors.name?.message}</Field.Error>
      </Field.Root>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button type="submit" loading={isPending} className="self-end">
        {isPending ? translations.saving : translations.save}
      </Button>
    </form>
  );
}

// ============================================================================
// Edit Slug View
// ============================================================================

interface EditSlugViewProps {
  beautyPageId: string;
  currentSlug: string;
  isOnCooldown: boolean;
  translations: EditProfileDialogProps["translations"];
  onSuccess: (newSlug: string) => void;
}

function EditSlugView({
  beautyPageId,
  currentSlug,
  isOnCooldown,
  translations,
  onSuccess,
}: EditSlugViewProps) {
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const slugSchema = createTranslatedBeautyPageSlugSchema((key) =>
    tValidation(key),
  );
  const formSchema = z.object({ slug: slugSchema });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ slug: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: { slug: currentSlug },
  });

  const watchedSlug = watch("slug");
  const slugWillChange = watchedSlug !== currentSlug;

  function onSubmit(data: { slug: string }) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateBeautyPageProfile({
        beautyPageId,
        slug: data.slug,
      });
      if (result.success) {
        onSuccess(data.slug);
        if (result.slugChanged) {
          router.push(`/${result.newSlug}`);
        }
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      <Field.Root>
        <Input
          type="text"
          placeholder={translations.slugPlaceholder}
          state={errors.slug ? "error" : "default"}
          disabled={isOnCooldown}
          autoFocus={!isOnCooldown}
          {...register("slug")}
        />
        <Field.Description>
          {isOnCooldown
            ? translations.slugCooldownWarning
            : slugWillChange
              ? translations.slugChangeWarning
              : translations.slugHint}
        </Field.Description>
        <Field.Error>{errors.slug?.message}</Field.Error>
      </Field.Root>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button
        type="submit"
        loading={isPending}
        disabled={isOnCooldown}
        className="self-end"
      >
        {isPending ? translations.saving : translations.save}
      </Button>
    </form>
  );
}

// ============================================================================
// Edit Bio View
// ============================================================================

interface EditBioViewProps {
  beautyPageId: string;
  currentBio: string | null;
  translations: EditProfileDialogProps["translations"];
  onSuccess: (newBio: string | null) => void;
}

function EditBioView({
  beautyPageId,
  currentBio,
  translations,
  onSuccess,
}: EditBioViewProps) {
  const tValidation = useTranslations("validation");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const formSchema = z.object({
    bio: z.string().max(BIO_MAX_LENGTH, tValidation("bio_max")),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ bio: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: { bio: currentBio ?? "" },
  });

  const watchedBio = watch("bio");

  function onSubmit(data: { bio: string }) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateBeautyPageProfile({
        beautyPageId,
        bio: data.bio,
      });
      if (result.success) {
        onSuccess(data.bio || null);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      <Field.Root>
        <Textarea
          placeholder={translations.bioPlaceholder}
          state={errors.bio ? "error" : "default"}
          rows={5}
          maxLength={BIO_MAX_LENGTH}
          autoFocus
          {...register("bio")}
        />
        <Field.Description>
          {translations.bioHint} ({watchedBio.length}/{BIO_MAX_LENGTH})
        </Field.Description>
        <Field.Error>{errors.bio?.message}</Field.Error>
      </Field.Root>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button type="submit" loading={isPending} className="self-end">
        {isPending ? translations.saving : translations.save}
      </Button>
    </form>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EditProfileDialog({
  beautyPageId,
  currentName,
  currentSlug,
  currentBio,
  currentAvatarUrl,
  slugChangedAt,
  translations,
}: EditProfileDialogProps) {
  const t = useTranslations("beauty_page_settings");

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<EditView>("menu");

  // Track navigation direction for animations
  const directionRef = useRef<"forward" | "back">("forward");

  // Local state to track values (updated after successful saves)
  const [localName, setLocalName] = useState(currentName);
  const [localSlug, setLocalSlug] = useState(currentSlug);
  const [localBio, setLocalBio] = useState(currentBio);
  const [localAvatarUrl, setLocalAvatarUrl] = useState(currentAvatarUrl);

  // Check if slug change is on cooldown
  const isSlugOnCooldown = (() => {
    if (!slugChangedAt) {
      return false;
    }
    const lastChange = new Date(slugChangedAt);
    const cooldownEnd = new Date(lastChange);
    cooldownEnd.setDate(cooldownEnd.getDate() + SLUG_COOLDOWN_DAYS);
    return new Date() < cooldownEnd;
  })();

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset to menu view when closing
      setView("menu");
      directionRef.current = "forward";
    }
  }

  function navigateTo(newView: EditView) {
    directionRef.current = "forward";
    setView(newView);
  }

  function navigateBack() {
    directionRef.current = "back";
    setView("menu");
  }

  function getTitle(): string {
    switch (view) {
      case "menu":
        return translations.title;
      case "avatar":
        return t("edit_avatar_title");
      case "name":
        return t("edit_name_title");
      case "slug":
        return t("edit_slug_title");
      case "bio":
        return t("edit_bio_title");
      default:
        return translations.title;
    }
  }

  // Animation direction based on navigation
  const isNavigatingBack = directionRef.current === "back";

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        id={`edit-profile-trigger-${beautyPageId}`}
        className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover"
      >
        {translations.editProfile}
      </Dialog.Trigger>

      <Dialog.Portal open={open} size="md">
        <Dialog.Header
          onClose={() => setOpen(false)}
          onBack={view !== "menu" ? navigateBack : undefined}
          showBackButton={view !== "menu"}
        >
          {getTitle()}
        </Dialog.Header>

        <Dialog.Body className="p-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={
                isNavigatingBack
                  ? slideVariants.enterFromLeft
                  : slideVariants.enterFromRight
              }
              animate={slideVariants.center}
              exit={
                isNavigatingBack
                  ? slideVariants.exitToRight
                  : slideVariants.exitToLeft
              }
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {view === "menu" && (
                <div className="divide-y divide-border">
                  <MenuItem
                    label={t("avatar_label")}
                    value={localAvatarUrl ? t("avatar_set") : null}
                    placeholder={t("avatar_placeholder")}
                    onClick={() => navigateTo("avatar")}
                  />
                  <MenuItem
                    label={translations.nameLabel}
                    value={localName}
                    onClick={() => navigateTo("name")}
                  />
                  <MenuItem
                    label={translations.slugLabel}
                    value={`@${localSlug}`}
                    onClick={() => navigateTo("slug")}
                    locked={isSlugOnCooldown}
                  />
                  <MenuItem
                    label={translations.bioLabel}
                    value={localBio}
                    placeholder={t("add_bio")}
                    onClick={() => navigateTo("bio")}
                  />
                </div>
              )}

              {view === "avatar" && (
                <div className="p-4">
                  <AvatarUpload
                    currentUrl={localAvatarUrl}
                    name={localName}
                    target={{ type: "beauty-page", beautyPageId }}
                    shape="rounded"
                    onUploadSuccess={async (url) => {
                      // Save avatar URL to database
                      const result = await updateBeautyPageProfile({
                        beautyPageId,
                        avatarUrl: url,
                      });
                      if (result.success) {
                        setLocalAvatarUrl(url);
                        navigateBack();
                      }
                    }}
                    onRemove={async () => {
                      // Update database to remove avatar
                      const result = await updateBeautyPageProfile({
                        beautyPageId,
                        avatarUrl: null,
                      });
                      if (result.success) {
                        setLocalAvatarUrl(null);
                      }
                    }}
                  />
                </div>
              )}

              {view === "name" && (
                <EditNameView
                  beautyPageId={beautyPageId}
                  currentName={localName}
                  translations={translations}
                  onSuccess={(newName) => {
                    setLocalName(newName);
                    navigateBack();
                  }}
                />
              )}

              {view === "slug" && (
                <EditSlugView
                  beautyPageId={beautyPageId}
                  currentSlug={localSlug}
                  isOnCooldown={isSlugOnCooldown}
                  translations={translations}
                  onSuccess={(newSlug) => {
                    setLocalSlug(newSlug);
                    navigateBack();
                  }}
                />
              )}

              {view === "bio" && (
                <EditBioView
                  beautyPageId={beautyPageId}
                  currentBio={localBio}
                  translations={translations}
                  onSuccess={(newBio) => {
                    setLocalBio(newBio);
                    navigateBack();
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Dialog.Body>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
