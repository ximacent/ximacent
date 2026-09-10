import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

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
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ximacent | Online Voting Platform",
    template: "%s · Ximacent",
  },
  description:
    "Ximacent is an online voting platform for awards, elections, events, organizations, schools, and communities.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Ximacent | Online Voting Platform",
    description:
      "Secure online voting for awards, elections, events, and organizations.",
    url: siteUrl,
    siteName: "Ximacent",
    images: ["/opengraph-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ximacent | Online Voting Platform",
    description:
      "Secure online voting for awards, elections, events, and organizations.",
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
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Ximacent",
              url: siteUrl,
              logo: `${siteUrl}/icon.png`,
              description:
                "Online voting platform for awards, elections, events, organizations, schools, and communities.",
              areaServed: "GH",
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Ximacent",
              url: siteUrl,
              description:
                "Secure online voting for awards, elections, events, and organizations.",
            },
          ]}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}