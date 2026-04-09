import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import ConditionalLayout from "@/components/navigation/conditional-layout";

import CookieConsent from "@/components/home/cookie-consent";

/* ═══════════════════════════════════════════════════════════
   SELF-HOSTED FONTS
   Stack: Playfair Display (headings) + Inter (body/UI) + Geist Mono (data)
   Source: Google Fonts CDN woff2 files — saved to public/fonts/
   Rule: Zero CDN requests at runtime. All files self-hosted.
═══════════════════════════════════════════════════════════ */

const playfairDisplay = localFont({
  src: [
    {
      path: "../public/fonts/PlayfairDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/PlayfairDisplay-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const inter = localFont({
  src: [
    {
      path: "../public/fonts/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "Helvetica Neue", "sans-serif"],
});

const instrumentSerif = localFont({
  src: "../public/fonts/InstrumentSerif-Italic.ttf",
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const geistMono = localFont({
  src: [
    {
      path: "../public/fonts/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/GeistMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
  fallback: ["'Courier New'", "monospace"],
});

/* ═══════════════════════════════════════════════════════════
   SEO METADATA (root — page-level overrides in each page.tsx)
═══════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: {
    default: "Plexovia — Federal Contract Monitoring for NAICS-Matched Opportunities",
    template: "%s | Plexovia",
  },
  description:
    "Every contract matching your NAICS codes. Delivered to your inbox by 6 AM. Plexovia monitors SAM.gov and all 50 state portals nightly. Scored alerts. 7-day free trial.",
  metadataBase: new URL("https://plexovia.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://plexovia.com",
    siteName: "Plexovia",
    title: "Plexovia — Federal Contract Alerts in Your Inbox by 6 AM",
    description:
      "Every contract matching your NAICS codes, scored 0 to 100, delivered to your inbox each morning. SAM.gov and all 50 states.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Plexovia — Government Contract Monitoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plexovia — Federal Contracts in Your Inbox by 6 AM",
    description:
      "Every contract matching your NAICS codes. Scored 0 to 100. SAM.gov and all 50 state portals monitored nightly.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://plexovia.com",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
};

/* ═══════════════════════════════════════════════════════════
   ROOT LAYOUT
═══════════════════════════════════════════════════════════ */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`
        ${playfairDisplay.variable}
        ${inter.variable}
        ${instrumentSerif.variable}
        ${geistMono.variable}
        h-full antialiased
      `}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to self — no external font CDN */}
        <link rel="preconnect" href="https://plexovia.com" />
        {/* JSON-LD Organization schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Plexovia",
              url: "https://plexovia.com",
              email: "support@plexovia.com",
              description:
                "Government contract monitoring platform tracking 50 US state portals and SAM.gov daily.",
              sameAs: [],
            }),
          }}
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-[#F7F5F0] text-[#1C1917] font-sans antialiased"
        style={{ fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}
      >
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
