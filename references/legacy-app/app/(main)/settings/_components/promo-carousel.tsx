"use client";

import { CalendarCheck, Scissors, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PromoSlide } from "./promo-slide";

const SLIDES = [
  { icon: Store, key: "slide_1" },
  { icon: Scissors, key: "slide_2" },
  { icon: CalendarCheck, key: "slide_3" },
] as const;

interface PromoCarouselProps {
  onComplete: () => void;
}

/**
 * Full-screen slide carousel with state-based navigation.
 * Each slide fills the available space with gradient header and content.
 */
export function PromoCarousel({ onComplete }: PromoCarouselProps) {
  const t = useTranslations("settings.promo");
  const [activeIndex, setActiveIndex] = useState(0);

  const handleContinue = () => {
    if (activeIndex < SLIDES.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      onComplete();
    }
  };

  const currentSlide = SLIDES[activeIndex];
  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <div className="flex flex-col">
      {/* Current slide */}
      <PromoSlide
        icon={currentSlide.icon}
        title={t(`${currentSlide.key}_title`)}
        description={t(`${currentSlide.key}_description`)}
        buttonLabel={isLastSlide ? t("continue") : t("next")}
        onContinue={handleContinue}
      />

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 pb-6">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              activeIndex === index
                ? "bg-foreground"
                : "bg-border hover:bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
