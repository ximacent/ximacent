import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yesvote.vercel.app"),
  title: {
    default: "Ximacent — Premium Online Voting",
    template: "%s · Ximacent",
  },
  description:
    "Cast secure paid votes for pageants, awards, and live competitions. Instant confirmation and live results.",
  openGraph: {
    title: "Ximacent — Premium Online Voting",
    description:
      "Cast secure paid votes for pageants, awards, and live competitions. Instant confirmation and live results.",
    url: "https://yesvote.vercel.app",
    siteName: "Ximacent",
    images: ["/opengraph-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ximacent — Premium Online Voting",
    description:
      "Cast secure paid votes for pageants, awards, and live competitions. Instant confirmation and live results.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${outfit.variable} h-full dark`}
    >
      <body className="min-h-full font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}