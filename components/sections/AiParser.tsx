"use client";

import { useState } from "react";
import { FadeUp } from "@/components/ui/FadeUp";
import { VerifiedBadge } from "@/components/ui/Badge";
import {
  MessageSquare,
  Sparkles,
  Mic,
  FileImage,
  ArrowRight,
  CheckCheck,
  Play,
  RotateCcw,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const chatMessages = [
  {
    sender: "Ludhiana Garments (Mohan ji)",
    time: "11:42 AM",
    type: "text",
    text: "Namaste sir, 500 pcs cotton round neck ka final rate Rs 205 per pc lagega. MOQ 250 hai.",
  },
  {
    sender: "Ludhiana Garments (Mohan ji)",
    time: "11:43 AM",
    type: "audio",
    duration: "0:24",
    text: "Voice Note: Freight Raipur tak tempo se lagbhag Rs 2400 aayega, GST 5% alag se bill me.",
  },
  {
    sender: "Ludhiana Garments (Mohan ji)",
    time: "11:45 AM",
    type: "image",
    text: "Parchi_RateCard_Nov26.jpg",
    subtext: "Handwritten dispatch rate card attached",
  },
  {
    sender: "Surat Textile Hub",
    time: "12:15 PM",
    type: "text",
    text: "Sir humara sticker Rs 196 flat hai but transport from Surat Rs 9800 minimum freight charge hoga.",
  },
];

const parsedRows = [
  {
    source: "Ludhiana Garments Co",
    rawQuote: "Rs205/pc + Rs2400 transport + 5% GST",
    unitPrice: "Rs205.00",
    moq: "250 pcs",
    freight: "Rs2,400",
    gst: "5%",
    landed: "Rs220.05",
    highlight: true,
    tag: "Best Landed Cost",
  },
  {
    source: "Surat Textile Hub",
    rawQuote: "Rs196/pc + Rs9800 transport + 5% GST",
    unitPrice: "Rs196.00",
    moq: "500 pcs",
    freight: "Rs9,800",
    gst: "5%",
    landed: "Rs225.40",
    highlight: false,
    tag: "Lowest Sticker Only",
  },
];

export function AiParser() {
  const reduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState<"both" | "ludhiana" | "surat">("both");
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1200);
  };

  return (
    <section id="ai-parser" className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <FadeUp className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-[rgba(34,37,42,0.06)] text-xs font-semibold text-ink mb-4 shadow-soft">
            <Sparkles size={14} className="text-coral" />
            WhatsApp to Structured Table Parser
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink tracking-tight mb-4">
            Turn Messy WhatsApp Quotes into Instant Landed Truth
          </h2>
          <p className="text-base text-ink-secondary leading-relaxed">
            Suppliers do not fill out web forms. They send Hinglish voice notes,
            informal chats, and photos of paper receipts. Coverly extracts the
            critical terms and calculates actual landed costs automatically.
          </p>
        </FadeUp>

        {/* Split Visual Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Realistic WhatsApp Container */}
          <FadeUp
            delay={0.1}
            className="lg:col-span-5 bg-[#EFEAE2] rounded-card-lg overflow-hidden border border-[rgba(34,37,42,0.1)] shadow-card flex flex-col"
          >
            {/* WhatsApp Header Bar */}
            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  💬
                </div>
                <div>
                  <div className="font-heading font-semibold text-sm leading-tight">
                    Supplier Inquiry Chat
                  </div>
                  <div className="text-[11px] text-white/80">
                    2 active vendor threads
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleScan}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-medium transition-colors"
                title="Run re-parse animation"
              >
                <RotateCcw size={12} className={isScanning ? "animate-spin" : ""} />
                Re-Parse
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-3 min-h-[380px] bg-[radial-gradient(#d4cbbe_1px,transparent_1px)] [background-size:16px_16px]">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="max-w-[88%] bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm border border-[rgba(0,0,0,0.04)] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-ink-secondary font-medium">
                    <span className="text-[#075E54] font-semibold">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>

                  {msg.type === "text" && (
                    <p className="text-xs text-ink leading-relaxed">
                      {msg.text}
                    </p>
                  )}

                  {msg.type === "audio" && (
                    <div className="bg-surface-muted rounded-xl p-2 flex items-center gap-2 border border-[rgba(0,0,0,0.04)]">
                      <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-shrink-0">
                        <Play size={12} fill="currentColor" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1 h-3">
                          {[3, 8, 12, 6, 14, 9, 5, 11, 7, 4].map((h, barIdx) => (
                            <span
                              key={barIdx}
                              className="w-1 bg-[#075E54]/40 rounded-full"
                              style={{ height: `${h}px` }}
                            />
                          ))}
                        </div>
                        <div className="text-[10px] text-ink-secondary font-mono">
                          {msg.duration} · {msg.text}
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.type === "image" && (
                    <div className="bg-[#FAF7F2] rounded-xl p-2.5 border border-[#E0D7C6] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-coral shadow-sm">
                        <FileImage size={18} />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-mono font-medium text-ink">
                          {msg.text}
                        </div>
                        <div className="text-[10px] text-ink-secondary">
                          {msg.subtext}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end items-center gap-1 text-[10px] text-[#25D366]">
                    <CheckCheck size={13} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Parser Indicator */}
            <div className="bg-surface p-3 border-t border-[rgba(34,37,42,0.06)] flex items-center justify-between text-xs text-ink-secondary">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                Listening to WhatsApp Business Webhook
              </span>
              <span className="font-mono text-[11px]">Realtime OCR</span>
            </div>
          </FadeUp>

          {/* Right: Clean Structured Table */}
          <FadeUp
            delay={0.2}
            className="lg:col-span-7 bg-surface rounded-card-lg p-6 sm:p-8 border border-[rgba(34,37,42,0.06)] shadow-card relative flex flex-col justify-between"
          >
            {/* Scanning Line Effect when triggered */}
            {isScanning && (
              <div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-coral to-transparent z-20 pointer-events-none animate-scan-line"
                aria-hidden="true"
              />
            )}

            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[rgba(34,37,42,0.06)] mb-6">
                <div>
                  <h3 className="text-lg font-heading font-semibold text-ink">
                    Structured Comparison Extraction
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Order requirement: 500 pcs Cotton T-Shirts to Raipur, C.G.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-verified bg-verified/10 px-3 py-1 rounded-full">
                  <Sparkles size={13} />
                  Extracted in 1.4s
                </div>
              </div>

              {/* Extraction Cards / Table View */}
              <div className="space-y-4">
                {parsedRows.map((row, idx) => (
                  <motion.div
                    key={row.source}
                    initial={reduce ? false : { opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.15 }}
                    className={`rounded-2xl p-4 border transition-all ${
                      row.highlight
                        ? "bg-surface-pink/40 border-coral/30 shadow-soft"
                        : "bg-surface-muted border-[rgba(34,37,42,0.06)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-sm text-ink">
                          {row.source}
                        </span>
                        <VerifiedBadge size="sm" />
                      </div>
                      <span
                        className={`text-xs font-heading font-semibold px-2.5 py-0.5 rounded-full ${
                          row.highlight
                            ? "bg-coral text-white"
                            : "bg-surface text-ink-secondary border border-[rgba(34,37,42,0.06)]"
                        }`}
                      >
                        {row.tag}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
                      <div>
                        <div className="text-[10px] text-ink-secondary uppercase tracking-wider font-semibold">
                          Unit Price
                        </div>
                        <div className="font-mono text-ink font-semibold mt-0.5">
                          {row.unitPrice}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-ink-secondary uppercase tracking-wider font-semibold">
                          MOQ
                        </div>
                        <div className="font-mono text-ink mt-0.5">{row.moq}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-ink-secondary uppercase tracking-wider font-semibold">
                          Freight
                        </div>
                        <div className="font-mono text-ink mt-0.5">{row.freight}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-ink-secondary uppercase tracking-wider font-semibold">
                          GST
                        </div>
                        <div className="font-mono text-ink mt-0.5">{row.gst}</div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-[rgba(34,37,42,0.06)] pt-1 sm:pt-0 sm:pl-3">
                        <div className="text-[10px] text-coral uppercase tracking-wider font-bold">
                          Landed/Unit
                        </div>
                        <div
                          className={`font-mono text-base font-bold mt-0.5 ${
                            row.highlight ? "text-coral" : "text-ink"
                          }`}
                        >
                          {row.landed}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom Callout Note */}
            <div className="mt-6 pt-4 border-t border-[rgba(34,37,42,0.06)] flex items-center justify-between text-xs text-ink-secondary">
              <span className="max-w-[42ch]">
                Notice: Surat appears Rs 9 cheaper on sticker, but high freight makes
                Ludhiana Rs 5.35 cheaper per landed unit.
              </span>
              <a
                href="#live-demo"
                className="inline-flex items-center gap-1 font-heading font-semibold text-coral hover:underline"
              >
                Try live demo <ArrowRight size={13} />
              </a>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
