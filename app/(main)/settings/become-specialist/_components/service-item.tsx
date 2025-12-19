"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { Select } from "@/lib/ui/select";
import { CURRENCIES, DURATION_OPTIONS, type Currency } from "../_lib/types";

interface ServiceItemProps {
  index: number;
  name: string;
  price: string;
  currency: Currency;
  durationMinutes: number;
  onNameChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (value: Currency) => void;
  onDurationChange: (value: number) => void;
  onRemove: () => void;
  errors?: {
    name?: string;
    price?: string;
  };
}

export function ServiceItem({
  index,
  name,
  price,
  currency,
  durationMinutes,
  onNameChange,
  onPriceChange,
  onCurrencyChange,
  onDurationChange,
  onRemove,
  errors,
}: ServiceItemProps) {
  const t = useTranslations("specialist.wizard");
  const tCurrencies = useTranslations("currencies");

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c,
    label: tCurrencies(c),
  }));

  const durationOptions = DURATION_OPTIONS.map((d) => ({
    value: d.value.toString(),
    label: d.label,
  }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {t("service_number", { number: index + 1 })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={t("remove_service")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Service Name */}
      <Field.Root>
        <Field.Label>{t("service_name_label")}</Field.Label>
        <Input
          type="text"
          placeholder={t("service_name_placeholder")}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          state={errors?.name ? "error" : "default"}
        />
        <Field.Error>{errors?.name}</Field.Error>
      </Field.Root>

      {/* Price and Currency */}
      <div className="grid grid-cols-2 gap-3">
        <Field.Root>
          <Field.Label>{t("price_label")}</Field.Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            state={errors?.price ? "error" : "default"}
          />
          <Field.Error>{errors?.price}</Field.Error>
        </Field.Root>

        <Field.Root>
          <Field.Label>{t("currency_label")}</Field.Label>
          <Select.Root
            value={currency}
            onValueChange={(value) => onCurrencyChange(value as Currency)}
          >
            <Select.Trigger />
            <Select.Content>
              {currencyOptions.map((option) => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Field.Root>
      </div>

      {/* Duration */}
      <Field.Root>
        <Field.Label>{t("duration_label")}</Field.Label>
        <Select.Root
          value={durationMinutes.toString()}
          onValueChange={(value) => onDurationChange(Number(value))}
        >
          <Select.Trigger />
          <Select.Content>
            {durationOptions.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Field.Root>
    </div>
  );
}
