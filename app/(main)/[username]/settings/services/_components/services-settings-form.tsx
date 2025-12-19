"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Input } from "@/lib/ui/input";
import { Button } from "@/lib/ui/button";
import { Select } from "@/lib/ui/select";
import { Switch } from "@/lib/ui/switch";
import { CURRENCIES, type Currency } from "@/app/(main)/settings/become-specialist/_lib/types";
import {
  createServiceGroup,
  updateServiceGroup,
  deleteServiceGroup,
  createService,
  updateService,
  deleteService,
} from "../../_actions/specialist-settings.action";

interface ServiceData {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  durationMinutes: number;
  isActive: boolean;
}

interface ServiceGroupData {
  id: string;
  name: string;
  isDefault: boolean;
  services: ServiceData[];
}

interface ServicesSettingsFormProps {
  specialistId: string;
  username: string;
  initialGroups: ServiceGroupData[];
}

export function ServicesSettingsForm({
  specialistId,
  username,
  initialGroups,
}: ServicesSettingsFormProps) {
  const t = useTranslations("specialist.settings.services");
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(initialGroups.map((g) => g.id)),
  );
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    startTransition(async () => {
      const result = await createServiceGroup(specialistId, {
        name: newGroupName.trim(),
      });
      if (result.success) {
        setNewGroupName("");
        setShowNewGroupInput(false);
        router.refresh();
      }
    });
  };

  const handleUpdateGroupName = (groupId: string, name: string) => {
    startTransition(async () => {
      const result = await updateServiceGroup(specialistId, groupId, { name });
      if (result.success) {
        setEditingGroupId(null);
        router.refresh();
      }
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    startTransition(async () => {
      const result = await deleteServiceGroup(specialistId, groupId);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleCreateService = (groupId: string) => {
    startTransition(async () => {
      const result = await createService(specialistId, groupId, {
        name: t("new_service_name"),
        price: 0,
        currency: "UAH",
        durationMinutes: 60,
      });
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleUpdateService = (
    serviceId: string,
    data: Partial<{
      name: string;
      price: number;
      currency: Currency;
      durationMinutes: number;
      isActive: boolean;
    }>,
  ) => {
    startTransition(async () => {
      const result = await updateService(specialistId, serviceId, data);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleDeleteService = (serviceId: string) => {
    startTransition(async () => {
      const result = await deleteService(specialistId, serviceId);
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {initialGroups.map((group) => (
        <div
          key={group.id}
          className="rounded-xl border border-foreground/10 bg-foreground/5 overflow-hidden"
        >
          {/* Group Header */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-foreground/5"
            onClick={() => toggleGroup(group.id)}
          >
            <div className="flex items-center gap-3">
              {expandedGroups.has(group.id) ? (
                <ChevronUp className="h-5 w-5 text-foreground/40" />
              ) : (
                <ChevronDown className="h-5 w-5 text-foreground/40" />
              )}

              {editingGroupId === group.id ? (
                <Input
                  defaultValue={group.name}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) =>
                    handleUpdateGroupName(group.id, e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUpdateGroupName(
                        group.id,
                        (e.target as HTMLInputElement).value,
                      );
                    }
                    if (e.key === "Escape") {
                      setEditingGroupId(null);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className="font-medium text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!group.isDefault) {
                      setEditingGroupId(group.id);
                    }
                  }}
                >
                  {group.name}
                  {group.isDefault && (
                    <span className="ml-2 text-xs text-foreground/60">
                      ({t("default_group")})
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/60">
                {group.services.length} {t("services_count")}
              </span>
              {!group.isDefault && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(group.id);
                  }}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>

          {/* Group Content */}
          {expandedGroups.has(group.id) && (
            <div className="border-t border-foreground/10 p-4 space-y-3">
              {group.services.map((service) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  onUpdate={(data) => handleUpdateService(service.id, data)}
                  onDelete={() => handleDeleteService(service.id)}
                  isPending={isPending}
                />
              ))}

              <Button
                type="button"
                variant="ghost"
                className="w-full justify-center gap-2 text-violet-600"
                onClick={() => handleCreateService(group.id)}
                disabled={isPending}
              >
                <Plus className="h-4 w-4" />
                {t("add_service")}
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Add New Group */}
      {showNewGroupInput ? (
        <div className="flex gap-2">
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder={t("new_group_placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateGroup();
              }
              if (e.key === "Escape") {
                setShowNewGroupInput(false);
                setNewGroupName("");
              }
            }}
            autoFocus
          />
          <Button onClick={handleCreateGroup} disabled={isPending || !newGroupName.trim()}>
            {t("add")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setShowNewGroupInput(false);
              setNewGroupName("");
            }}
          >
            {t("cancel")}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-center gap-2"
          onClick={() => setShowNewGroupInput(true)}
        >
          <Plus className="h-4 w-4" />
          {t("add_group")}
        </Button>
      )}
    </div>
  );
}

interface ServiceItemProps {
  service: ServiceData;
  onUpdate: (data: Partial<ServiceData>) => void;
  onDelete: () => void;
  isPending: boolean;
}

function ServiceItem({ service, onUpdate, onDelete, isPending }: ServiceItemProps) {
  const t = useTranslations("specialist.settings.services");
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState(service.price.toString());
  const [currency, setCurrency] = useState(service.currency);
  const [duration, setDuration] = useState(service.durationMinutes.toString());

  const handleSave = () => {
    onUpdate({
      name,
      price: parseFloat(price) || 0,
      currency,
      durationMinutes: parseInt(duration) || 60,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("service_name")}
        />

        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t("price")}
          />
          <Select.Root value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <Select.Trigger placeholder={t("currency")} />
            <Select.Content>
              {CURRENCIES.map((c) => (
                <Select.Item key={c} value={c}>
                  {c}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder={t("duration")}
          />
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {t("save")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setName(service.name);
              setPrice(service.price.toString());
              setCurrency(service.currency);
              setDuration(service.durationMinutes.toString());
              setIsEditing(false);
            }}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-foreground/10 bg-foreground/5 p-3">
      <div className="flex items-center gap-3">
        <Switch
          checked={service.isActive}
          onCheckedChange={(checked) => onUpdate({ isActive: checked })}
        />
        <div>
          <p
            className="font-medium text-foreground cursor-pointer hover:text-violet-600"
            onClick={() => setIsEditing(true)}
          >
            {service.name}
          </p>
          <p className="text-sm text-foreground/60">
            {service.durationMinutes} min
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-semibold text-foreground">
          {service.currency === "UAH" && "₴"}
          {service.currency === "USD" && "$"}
          {service.currency === "EUR" && "€"}
          {service.price}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
