import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "../components/site-footer";
import "./globals.css";
import "./site-footer.css";

export const metadata: Metadata = {
  title: "Caribbean Star Store TT",
  description: "A Caribbean marketplace connecting buyers and sellers.",
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
