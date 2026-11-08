import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE, CONTACT_EMAIL, CONTACT_PHONE } from "data/contact";

export default function Footer() {
  const whatsappHref = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}` : "";

  return (
    <section id="contact" className="py-20 bg-surface">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-ink mb-8 text-center">
          Get in Touch
        </h2>

        {/* Contact Details Block */}
        {(CONTACT_EMAIL || CONTACT_PHONE) && (
          <div className="mb-10 text-center">
            {CONTACT_EMAIL && (
              <p className="text-ink mb-2">
                Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-coral hover:underline">{CONTACT_EMAIL}</a>
              </p>
            )}
            {CONTACT_PHONE && (
              <p className="text-ink">
                Phone: <a href={`tel:${CONTACT_PHONE}`} className="text-coral hover:underline">{CONTACT_PHONE}</a>
              </p>
            )}
          </div>
        )}

        {/* WhatsApp Button */}
        <div className="mb-10 text-center">
          {WHATSAPP_NUMBER ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full font-heading font-semibold transition-all duration-300 bg-[#25D366] text-white hover:bg-[#24c15e] shadow-soft hover:shadow-card px-4 py-2 text-sm"
              aria-label="Chat on WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.46-2.39-1.405-1.186-.986-1.959-2.244-2.133-2.743-.173-.499-.015-.749.13-.948.146-.198.322-.322.47-.47.146-.148.197-.248.297-.421.099-.174.05-.347-.025-.496-.074-.148-.669-1.612-.916-2.177-.247-.565-.495-.491-.67-.491h-.496c-.173 0-.448.075-.695.374-.247.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.148.199 2.096 3.2 5.077 4.487 2.084.936 2.509.717 3.074.692.565-.025 1.758-.692 2.03-1.361.273-.669.273-1.239.198-1.387z"/>
              </svg>
              Chat on WhatsApp
            </a>
          ) : (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full font-heading font-semibold transition-all duration-300 bg-[#25D366] text-white hover:bg-[#24c15e] shadow-soft hover:shadow-card px-4 py-2 text-sm opacity-60 cursor-not-allowed"
              aria-disabled="true"
              aria-label="WhatsApp number coming soon"
              title="WhatsApp number coming soon"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.46-2.39-1.405-1.186-.986-1.959-2.244-2.133-2.743-.173-.499-.015-.749.13-.948.146-.198.322-.322.47-.47.146-.148.197-.248.297-.421.099-.174.05-.347-.025-.496-.074-.148-.669-1.612-.916-2.177-.247-.565-.495-.491-.67-.491h-.496c-.173 0-.448.075-.695.374-.247.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.148.199 2.096 3.2 5.077 4.487 2.084.936 2.509.717 3.074.692.565-.025 1.758-.692 2.03-1.361.273-.669.273-1.239.198-1.387z"/>
              </svg>
              Chat on WhatsApp
            </button>
          )}
        </div>

        {/* Concierge Lead Form */}
        <form className="max-w-md mx-auto bg-surface-muted/50 rounded-2xl p-6 shadow-soft border border-[rgba(45,50,80,0.06)]">
          <h3 className="text-lg font-heading font-semibold text-ink mb-4 text-center">
            Talk to our Concierge Team
          </h3>

          <div className="space-y-4">
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Your Name"
              required
              className="w-full px-4 py-3 rounded-xl bg-surface border border-[rgba(45,50,80,0.1)] text-ink placeholder:text-ink/50 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all duration-200"
            />

            <input
              type="email"
              name="email"
              id="email"
              placeholder="Your Email"
              required
              className="w-full px-4 py-3 rounded-xl bg-surface border border-[rgba(45,50,80,0.1)] text-ink placeholder:text-ink/50 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all duration-200"
            />

            <input
              type="tel"
              name="phone"
              id="phone"
              placeholder="Your Phone Number"
              required
              className="w-full px-4 py-3 rounded-xl bg-surface border border-[rgba(45,50,80,0.1)] text-ink placeholder:text-ink/50 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all duration-200"
            />

            <textarea
              name="message"
              id="message"
              placeholder="How can we help you today?"
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-[rgba(45,50,80,0.1)] text-ink placeholder:text-ink/50 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all duration-200 resize-none"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-navy text-white font-heading font-semibold hover:bg-[#424769] shadow-soft hover:shadow-card transition-all duration-200"
            >
              Submit Request
            </button>
          </div>

          <p className="text-center text-ink/60 text-sm mt-4">
            Our team will get back to you within 24 hours.
          </p>
        </form>
      </div>
    </section>
  );
}
