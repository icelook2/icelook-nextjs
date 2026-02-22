"use client";

import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ServiceGroupWithServices } from "@/lib/queries";
import { Menu } from "@/lib/ui/menu";
import { CreateServiceDialog } from "./create-service-dialog";
import { DeleteServiceGroupDialog } from "./delete-service-group-dialog";
import { RenameServiceGroupDialog } from "./rename-service-group-dialog";

interface ServiceGroupMenuProps {
  serviceGroup: ServiceGroupWithServices;
  beautyPageId: string;
  nickname: string;
}

export function ServiceGroupMenu({
  serviceGroup,
  beautyPageId,
  nickname,
}: ServiceGroupMenuProps) {
  const t = useTranslations("service_groups");
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Menu.Root>
        <Menu.Trigger>
          <MoreVertical className="h-4 w-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content>
            <Menu.Item icon={Plus} onClick={() => setCreateServiceOpen(true)}>
              {t("menu_add_service")}
            </Menu.Item>
            <Menu.Item icon={Pencil} onClick={() => setRenameOpen(true)}>
              {t("menu_rename")}
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

      <CreateServiceDialog
        serviceGroupId={serviceGroup.id}
        nickname={nickname}
        open={createServiceOpen}
        onOpenChange={setCreateServiceOpen}
      />

      <RenameServiceGroupDialog
        serviceGroup={serviceGroup}
        beautyPageId={beautyPageId}
        nickname={nickname}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <DeleteServiceGroupDialog
        serviceGroup={serviceGroup}
        beautyPageId={beautyPageId}
        nickname={nickname}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
