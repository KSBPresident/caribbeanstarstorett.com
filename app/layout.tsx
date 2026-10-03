import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Lora, Nunito_Sans } from "next/font/google";
import { SiteFooter } from "../components/site-footer";
import { CartProvider } from "../components/cart-provider";
import "./globals.css";
import "./site-footer.css";

const islandDisplay = Lora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-island-display" });
const islandSans = Nunito_Sans({ subsets: ["latin"], display: "swap", variable: "--font-island-sans" });

const brandLogo = "/caribbean-star-store-logo.svg";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.caribbeanstarstorett.com"),
  title: {
    default: "Caribbean Star Store",
    template: "%s | Caribbean Star Store",
  },
  description:
    "Discover products, services, businesses, jobs, and real estate with Caribbean Star Store, an international marketplace connecting communities worldwide.",
  icons: {
    icon: [{ url: brandLogo, type: "image/svg+xml" }],
    shortcut: [{ url: brandLogo, type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "Caribbean Star Store",
    title: "Caribbean Star Store",
    description:
      "Discover products, services, Caribbean businesses, jobs, and real estate. Connecting the community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caribbean Star Store",
    description:
      "Discover products, services, Caribbean businesses, jobs, and real estate. Connecting the community.",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${islandDisplay.variable} ${islandSans.variable}`}>
      <body>
        <a className="skip-to-content" href="#main-content">Skip to content</a>
        <CartProvider>
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
