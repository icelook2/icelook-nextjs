"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Menu } from "@/lib/ui/menu";

interface BreakMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Dropdown menu for break-level actions
 *
 * Displayed on break cards for future breaks.
 * Actions include editing break times and deleting the break.
 */
export function BreakMenu({ onEdit, onDelete }: BreakMenuProps) {
  const t = useTranslations("schedule");

  return (
    <Menu.Root>
      <Menu.Trigger aria-label={t("break_actions.menu_label")}>
        <MoreVertical className="h-4 w-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end">
          <Menu.Item icon={Pencil} onClick={onEdit}>
            {t("break_actions.edit")}
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item icon={Trash2} variant="danger" onClick={onDelete}>
            {t("break_actions.delete")}
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
