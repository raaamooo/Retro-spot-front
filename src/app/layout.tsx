import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/contexts/ToastContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNavBar from "@/components/layout/MobileNavBar";
import { API_URL } from "@/lib/constants";

/* ═══════════════════════════════════════════════════════════════
   SEO — Metadata, Open Graph, Twitter Card, Structured Data
   ═══════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Retro Spot | Cafe & Workspace",
  description:
    "Your cozy space for coffee, work, and art. A retro-themed cafe and workspace experience in Cairo, Egypt.",
  icons: {
    icon: "/logo.jpeg",
  },
  openGraph: {
    title: "Retro Spot | Cafe & Workspace",
    description:
      "Specialty coffee, curated vinyl, and a creative workspace — all in one retro-themed spot.",
    url: "https://retrospot.cafe",
    siteName: "Retro Spot",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Retro Spot | Cafe & Workspace",
    description:
      "Specialty coffee, curated vinyl, and a creative workspace — all in one retro-themed spot.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://retrospot.cafe',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1C0E06",
};

/* ── JSON-LD Structured Data for Local Business ── */
const baseJsonLd = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  name: "Retro Spot",
  description:
    "A retro-themed cafe combining specialty coffee, a productive workspace, and an inspiring art gallery.",
  url: "https://retrospot.cafe",
  telephone: "+20-101-234-5678",
  email: "hello@retrospot.cafe",
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Retro St, Downtown",
    addressLocality: "Cairo",
    addressCountry: "EG",
  },
  servesCuisine: "Coffee, Beverages, Light Bites",
  priceRange: "$$",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let jsonLd = { ...baseJsonLd };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${API_URL}/api/menu`, { 
      next: { revalidate: 3600 },
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const menuSections = data.map((cat: any) => ({
        "@type": "MenuSection",
        name: cat.nameEn,
        hasMenuItem: cat.items.map((item: any) => ({
          "@type": "MenuItem",
          name: item.nameEn,
          offers: { "@type": "Offer", price: item.price.toString(), priceCurrency: "EGP" }
        }))
      }));
      (jsonLd as any).hasMenu = {
        "@type": "Menu",
        name: "Retro Spot Menu",
        hasMenuSection: menuSections
      };
    }
  } catch (err) {
    console.error('Failed to fetch menu for JSON-LD', err);
  }

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster font loading (replaces render-blocking @import) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Tajawal:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <LanguageProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <ToastProvider>
              <Header />
              <main className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
              </main>
              <Footer />
              <MobileNavBar />
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
