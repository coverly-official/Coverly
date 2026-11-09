"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AccountDialog } from "@/components/ui/AccountDialog";
import { FadeUp } from "@/components/ui/FadeUp";

export function Hero() {
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <section
      id="hero"
      className="relative pt-8 md:pt-14 pb-16 md:pb-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeUp className="bg-surface-muted rounded-card-lg p-8 sm:p-12 md:p-16 border border-[rgba(45,50,80,0.06)] shadow-soft text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-ink tracking-tight leading-[1.12] max-w-3xl mx-auto mb-5">
            Find providers, compare quotes and manage orders in one place.
          </h1>
          <p className="text-base md:text-lg text-ink-secondary max-w-2xl mx-auto mb-8">
            Coverly helps businesses discover providers, compare quotations and
            manage orders from one platform, starting with nearby suppliers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#products">
              <Button variant="primary" size="lg">
                Browse Products
              </Button>
            </a>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setAccountOpen(true)}
            >
              Login
            </Button>
          </div>
        </FadeUp>
      </div>
      <AccountDialog isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </section>
  );
}