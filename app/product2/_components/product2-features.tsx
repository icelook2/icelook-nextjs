import { Calendar, Clock, MessageCircle, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Paper } from "@/lib/ui/paper";
import { DeviceFrame, ScreenshotPlaceholder } from "./shared";

/**
 * Feature walkthrough section with device frames showing real screenshots.
 * Each feature has a description on one side and a device mockup on the other.
 */
export async function Product2Features() {
  const t = await getTranslations("product2");

  return (
    <section id="features" className="scroll-mt-20 border-t border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="space-y-24">
          {/* Feature 1: Your Booking Page */}
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-accent">
                <Calendar className="h-4 w-4" />
                {t("features.feature1_badge")}
              </div>
              <h2 className="text-3xl font-bold">
                {t("features.feature1_title")}
              </h2>
              <p className="mt-4 text-lg text-muted">
                {t("features.feature1_description")}
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  t("features.feature1_bullet1"),
                  t("features.feature1_bullet2"),
                  t("features.feature1_bullet3"),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted">
                    <Check className="h-4 w-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <DeviceFrame type="phone">
              <ScreenshotPlaceholder
                label={t("features.screenshot1_label")}
                description={t("features.screenshot1_description")}
                dimensions="390x844"
                className="aspect-[9/19.5] min-h-[400px]"
              />
            </DeviceFrame>
          </div>

          {/* Feature 2: Your Dashboard */}
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Paper className="order-2 overflow-hidden lg:order-1">
              <DeviceFrame type="laptop">
                <ScreenshotPlaceholder
                  label={t("features.screenshot2_label")}
                  description={t("features.screenshot2_description")}
                  dimensions="1440x900"
                  className="aspect-video min-h-[300px]"
                />
              </DeviceFrame>
            </Paper>

            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-accent">
                <Clock className="h-4 w-4" />
                {t("features.feature2_badge")}
              </div>
              <h2 className="text-3xl font-bold">
                {t("features.feature2_title")}
              </h2>
              <p className="mt-4 text-lg text-muted">
                {t("features.feature2_description")}
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  t("features.feature2_bullet1"),
                  t("features.feature2_bullet2"),
                  t("features.feature2_bullet3"),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted">
                    <Check className="h-4 w-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3: Smart Reminders */}
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-accent">
                <MessageCircle className="h-4 w-4" />
                {t("features.feature3_badge")}
              </div>
              <h2 className="text-3xl font-bold">
                {t("features.feature3_title")}
              </h2>
              <p className="mt-4 text-lg text-muted">
                {t("features.feature3_description")}
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  t("features.feature3_bullet1"),
                  t("features.feature3_bullet2"),
                  t("features.feature3_bullet3"),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted">
                    <Check className="h-4 w-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <DeviceFrame type="phone">
              <ScreenshotPlaceholder
                label={t("features.screenshot3_label")}
                description={t("features.screenshot3_description")}
                dimensions="390x200"
                className="aspect-[9/19.5] min-h-[400px]"
              />
            </DeviceFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
