import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Globe,
  Heart,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { IcelookLogo } from "@/components/icelook-logo";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { LandingFooter } from "./landing-footer";

/**
 * Main Landing Page
 *
 * Video/Demo-centric design that leads with a video player/demo as the main hero element.
 * Emphasizes "see it in action" approach.
 */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal Header */}
      <header className="sticky top-12 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <IcelookLogo size={26} />
            <span className="font-semibold">Icelook</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" render={<Link href="/auth" />}>
              Log in
            </Button>
            <Button variant="primary" size="sm" render={<Link href="/auth" />}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero with Video */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent mb-6">
              <Play className="h-4 w-4" />
              Watch how it works
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              See your booking page in action
            </h1>

            <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
              Watch how beauty professionals use Icelook to manage appointments
              and grow their business
            </p>
          </div>

          {/* Video Player Mockup */}
          <Paper className="relative overflow-hidden aspect-video max-w-4xl mx-auto">
            {/* Video content representation */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-pink-500/10 to-orange-500/10" />

            {/* Booking flow mockup as "video" */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
                {/* Step 1 */}
                <div className="bg-surface/90 backdrop-blur rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-xs font-medium">Step 1</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400" />
                    <div className="h-3 w-20 rounded bg-surface-alt" />
                    <div className="h-2 w-16 rounded bg-surface-alt" />
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-surface/90 backdrop-blur rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-xs font-medium">Step 2</span>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="h-2 w-16 rounded bg-surface-alt" />
                        <div className="h-2 w-8 rounded bg-accent/30" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-surface/90 backdrop-blur rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-xs font-medium">Booked!</span>
                  </div>
                  <div className="flex items-center justify-center h-16">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                </div>
              </div>
            </div>

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer group">
              <div className="w-20 h-20 rounded-full bg-white/90 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-accent fill-accent ml-1" />
              </div>
            </div>
          </Paper>

          {/* CTA below video */}
          <div className="mt-8 text-center">
            <Button variant="primary" size="lg" render={<Link href="/auth" />}>
              Try it yourself
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-sm text-muted">
              Free forever • No credit card
            </p>
          </div>
        </section>

        {/* Quick benefits */}
        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Clock, label: "5 min setup" },
                { icon: Users, label: "500+ specialists" },
                { icon: Heart, label: "4.9 rating" },
                { icon: Globe, label: "Works worldwide" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-center gap-3"
                >
                  <item.icon className="h-5 w-5 text-accent" />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature walkthrough */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="space-y-24">
            {/* Feature 1 */}
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-sm text-accent font-medium mb-4">
                  <Calendar className="h-4 w-4" />
                  Your Booking Page
                </div>
                <h2 className="text-3xl font-bold">
                  A beautiful page that converts visitors to clients
                </h2>
                <p className="mt-4 text-lg text-muted">
                  Your personal booking page showcases your services, portfolio,
                  and availability. Clients can book in under 30 seconds.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Custom branding and colors",
                    "Service descriptions and pricing",
                    "Real-time availability",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-muted"
                    >
                      <Check className="h-4 w-4 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Paper className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                  <div>
                    <h3 className="font-semibold text-lg">Amber Beauty</h3>
                    <p className="text-sm text-muted">Hair & Makeup</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {["Haircut", "Styling", "Makeup"].map((service) => (
                    <div
                      key={service}
                      className="p-3 rounded-lg bg-surface-alt flex justify-between"
                    >
                      <span className="text-sm">{service}</span>
                      <span className="text-sm text-accent font-medium">
                        Book →
                      </span>
                    </div>
                  ))}
                </div>
              </Paper>
            </div>

            {/* Feature 2 */}
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <Paper className="p-6 order-2 lg:order-1">
                <h4 className="font-medium mb-4">Today's Schedule</h4>
                <div className="space-y-2">
                  {[
                    {
                      time: "9:00",
                      name: "Anna M.",
                      service: "Haircut",
                      status: "done",
                    },
                    {
                      time: "11:00",
                      name: "Kate S.",
                      service: "Color",
                      status: "now",
                    },
                    {
                      time: "2:00",
                      name: "Maria L.",
                      service: "Styling",
                      status: "next",
                    },
                  ].map((apt) => (
                    <div
                      key={apt.time}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        apt.status === "now"
                          ? "bg-accent/10 border border-accent/20"
                          : apt.status === "done"
                            ? "bg-surface-alt opacity-60"
                            : "bg-surface-alt"
                      }`}
                    >
                      <span className="text-sm font-medium w-12">
                        {apt.time}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{apt.name}</p>
                        <p className="text-xs text-muted">{apt.service}</p>
                      </div>
                      {apt.status === "done" && (
                        <Check className="h-4 w-4 text-success" />
                      )}
                      {apt.status === "now" && (
                        <span className="text-xs text-accent font-medium">
                          In Progress
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Paper>

              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 text-sm text-accent font-medium mb-4">
                  <Clock className="h-4 w-4" />
                  Your Dashboard
                </div>
                <h2 className="text-3xl font-bold">
                  Manage your day at a glance
                </h2>
                <p className="mt-4 text-lg text-muted">
                  See all your appointments, manage your schedule, and keep
                  track of your clients — all from one simple dashboard.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Daily and weekly schedule view",
                    "Client history and notes",
                    "Quick actions for common tasks",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-muted"
                    >
                      <Check className="h-4 w-4 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-sm text-accent font-medium mb-4">
                  <MessageCircle className="h-4 w-4" />
                  Smart Reminders
                </div>
                <h2 className="text-3xl font-bold">
                  Reduce no-shows automatically
                </h2>
                <p className="mt-4 text-lg text-muted">
                  Automatic reminders via SMS and email keep your clients
                  informed and reduce no-shows by up to 80%.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "24-hour reminder before appointment",
                    "Confirmation when booked",
                    "Rescheduling made easy",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-muted"
                    >
                      <Check className="h-4 w-4 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Paper className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Reminder sent</p>
                    <p className="text-xs text-muted">Just now</p>
                  </div>
                </div>
                <div className="bg-surface-alt rounded-lg p-4 text-sm">
                  <p className="text-muted">
                    Hi Anna! This is a reminder for your appointment tomorrow at
                    10:00 AM with Amber Beauty for Haircut & Styling.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs">
                      Confirm
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface text-muted text-xs">
                      Reschedule
                    </span>
                  </div>
                </div>
              </Paper>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-gradient-to-b from-accent/5 to-transparent">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-accent mb-6" />
            <h2 className="text-3xl font-bold md:text-4xl">Ready to try it?</h2>
            <p className="mt-4 text-lg text-muted">
              Create your free booking page in minutes
            </p>
            <Button
              variant="primary"
              size="lg"
              className="mt-8"
              render={<Link href="/auth" />}
            >
              Get started free
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
