import { FadeUp } from "@/components/ui/FadeUp";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function Hero() {
  return (
    <section id="hero" className="py-20 bg-surface">
      <div className="container mx-auto px-4 max-w-5xl text-center">
        <FadeUp delay={0}>
          <p className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">
            Raw Materials & Business Sourcing
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-ink mb-4">
            Find providers, compare quotes and manage orders in one place.
          </h1>
          <p className="text-lg text-ink/80 max-w-2xl mx-auto mb-6">
            Coverly helps businesses discover providers, compare quotations and manage orders from one platform, starting with nearby suppliers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#products" className="block">
              <Button variant="primary" size="lg">
                Browse Products
              </Button>
            </a>
            <a href="#contact" className="block">
              <Button variant="ghost" size="lg">
                Login
              </Button>
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
