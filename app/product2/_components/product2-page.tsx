import { LandingFooter } from "@/app/_components/landing/landing-footer";
import { Product2Header } from "./product2-header";
import { Product2Hero } from "./product2-hero";
import { Product2SocialProof } from "./product2-social-proof";
import { Product2Demo } from "./product2-demo";
import { Product2Features } from "./product2-features";
import { Product2Testimonials } from "./product2-testimonials";
import { Product2Problems } from "./product2-problems";
import { Product2HowItWorks } from "./product2-how-it-works";
import { Product2ClientsCta } from "./product2-clients-cta";
import { Product2FinalCta } from "./product2-final-cta";

/**
 * Product2 Page - Human-centered landing page design.
 *
 * This page showcases the app with:
 * - Real product screenshots (placeholders for now)
 * - Video demonstrations
 * - Testimonials from beauty professionals
 * - Human-focused imagery and social proof
 *
 * Structure:
 * 1. Hero with video placeholder + mini testimonial
 * 2. Social proof bar with avatar row
 * 3. Product demo section (video walkthrough)
 * 4. Feature walkthrough with device frame screenshots
 * 5. Testimonials from specialists
 * 6. Problems section (pain points)
 * 7. How it works (3 steps with screenshots)
 * 8. Clients CTA (secondary audience)
 * 9. Final CTA with avatar collage
 * 10. Footer (reused from landing)
 */
export function Product2Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Product2Header />

      <main className="flex-1">
        {/* Hero with gradient background */}
        <div className="bg-gradient-to-b from-accent/5 to-transparent">
          <Product2Hero />
        </div>
        <Product2SocialProof />
        <Product2Demo />
        <Product2Features />
        <Product2Testimonials />
        <Product2Problems />
        <Product2HowItWorks />
        <Product2ClientsCta />
        <Product2FinalCta />
      </main>

      <LandingFooter />
    </div>
  );
}
