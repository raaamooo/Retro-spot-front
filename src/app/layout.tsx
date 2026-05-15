import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/contexts/ToastContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Retro Spot | Cafe & Workspace",
  description:
    "Your cozy space for coffee, work, and art. A retro-themed cafe and workspace experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className="font-sans antialiased min-h-screen flex flex-col"
      >
        <LanguageProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <ToastProvider>
              <Header />
              <main className="flex-1 flex flex-col">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer />
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
