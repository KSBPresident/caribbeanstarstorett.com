import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "../components/site-footer";
import "./globals.css";
import "./site-footer.css";

const brandLogo = "/caribbean-star-store-logo.svg";

export const metadata: Metadata = {
  title: {
    default: "Caribbean Star Store TT",
    template: "%s | Caribbean Star Store TT",
  },
  description:
    "Discover products, services, Caribbean businesses, jobs, and real estate with Caribbean Star Store TT — connecting the community.",
  icons: {
    icon: [{ url: brandLogo, type: "image/svg+xml" }],
    shortcut: [{ url: brandLogo, type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "Caribbean Star Store TT",
    title: "Caribbean Star Store TT",
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
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
