import { Quote, Star, Scissors, Sparkles, Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Paper } from "@/lib/ui/paper";

/**
 * Testimonials section showing quotes from beauty professionals.
 * Uses placeholder content that can be replaced with real testimonials later.
 */
export async function Product2Testimonials() {
  const t = await getTranslations("product2");

  const testimonials = [
    {
      quote: t("testimonials.quote1"),
      name: t("testimonials.name1"),
      role: t("testimonials.role1"),
      city: t("testimonials.city1"),
      initials: "AM",
      gradient: "from-violet-400 to-purple-500",
      icon: Scissors,
    },
    {
      quote: t("testimonials.quote2"),
      name: t("testimonials.name2"),
      role: t("testimonials.role2"),
      city: t("testimonials.city2"),
      initials: "OK",
      gradient: "from-pink-400 to-rose-500",
      icon: Sparkles,
    },
    {
      quote: t("testimonials.quote3"),
      name: t("testimonials.name3"),
      role: t("testimonials.role3"),
      city: t("testimonials.city3"),
      initials: "ML",
      gradient: "from-amber-400 to-orange-500",
      icon: Heart,
    },
  ];

  return (
    <section className="bg-gradient-to-b from-transparent via-accent/5 to-transparent">
      <div className="mx-auto max-w-6xl px-4 py-20">
        {/* Section headline */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            {t("testimonials.headline")}
          </h2>
          <p className="mt-3 text-muted">{t("testimonials.subheadline")}</p>
        </div>

        {/* Testimonial cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Paper key={testimonial.name} className="flex flex-col p-6">
              {/* Avatar placeholder */}
              <div className="mb-4 flex items-center gap-3">
                {/* Placeholder: gradient circle with initials */}
                {/* Replace with: <img src="/landing/people/testimonial-X.jpg" /> */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ${testimonial.gradient}`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted">
                    <testimonial.icon className="h-3 w-3" />
                    <span>{testimonial.role}</span>
                  </div>
                  <p className="text-xs text-muted">{testimonial.city}</p>
                </div>
              </div>

              {/* Quote */}
              <div className="flex flex-1 items-start gap-2">
                <Quote className="mt-1 h-4 w-4 shrink-0 rotate-180 text-accent/40" />
                <p className="text-muted">{testimonial.quote}</p>
              </div>

              {/* Star rating */}
              <div className="mt-4 flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </Paper>
          ))}
        </div>

        {/* Note about placeholders (remove in production) */}
        <p className="mt-8 text-center text-xs text-muted/50">
          {t("testimonials.placeholder_note")}
        </p>
      </div>
    </section>
  );
}
