import type { Metadata } from "next";
import { Raleway, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
  weight: ["400", "600"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Coverly - Compare True Landed Costs Instantly",
  description:
    "The modern wholesale marketplace for Indian MSMEs. Compare quotes with unit price, MOQ, GST, and freight calculated into one true landed cost.",
  keywords: [
    "B2B marketplace",
    "wholesale India",
    "MSME sourcing",
    "landed cost calculator",
    "raw materials procurement",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-[100dvh] font-body text-ink antialiased selection:bg-coral selection:text-white">
        {children}
      </body>
    </html>
  );
}
