"use client";

import { Clock, Coins, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Service } from "@/lib/queries";
import { Menu } from "@/lib/ui/menu";
import { ChangeDurationDialog } from "./change-duration-dialog";
import { ChangePriceDialog } from "./change-price-dialog";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { RenameServiceDialog } from "./rename-service-dialog";

interface ServiceMenuProps {
  service: Service;
  nickname: string;
}

export function ServiceMenu({ service, nickname }: ServiceMenuProps) {
  const t = useTranslations("service_groups");
  const [renameOpen, setRenameOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Menu.Root>
        <Menu.Trigger>
          <MoreVertical className="h-4 w-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content>
            <Menu.Item icon={Pencil} onClick={() => setRenameOpen(true)}>
              {t("menu_rename")}
            </Menu.Item>
            <Menu.Item icon={Coins} onClick={() => setPriceOpen(true)}>
              {t("menu_change_price")}
            </Menu.Item>
            <Menu.Item icon={Clock} onClick={() => setDurationOpen(true)}>
              {t("menu_change_duration")}
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
              icon={Trash2}
              variant="danger"
              onClick={() => setDeleteOpen(true)}
            >
              {t("menu_delete")}
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>

      <RenameServiceDialog
        service={service}
        nickname={nickname}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <ChangePriceDialog
        service={service}
        nickname={nickname}
        open={priceOpen}
        onOpenChange={setPriceOpen}
      />

      <ChangeDurationDialog
        service={service}
        nickname={nickname}
        open={durationOpen}
        onOpenChange={setDurationOpen}
      />

      <DeleteServiceDialog
        service={service}
        nickname={nickname}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
