import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu | Retro Spot',
  description: 'Explore our curated selection of specialty coffee, pastries, milkshakes, and cocktails at Retro Spot.',
  openGraph: {
    title: 'Menu | Retro Spot',
    description: 'Explore our curated selection of specialty coffee, pastries, milkshakes, and cocktails at Retro Spot.',
    url: 'https://retrospot.cafe/menu',
    siteName: 'Retro Spot',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Menu | Retro Spot',
    description: 'Explore our curated selection of specialty coffee, pastries, milkshakes, and cocktails at Retro Spot.',
  },
  alternates: {
    canonical: 'https://retrospot.cafe/menu',
  },
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
