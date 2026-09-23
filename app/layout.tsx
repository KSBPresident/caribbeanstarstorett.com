import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Caribbean Star Store TT", description: "A Caribbean marketplace connecting buyers and sellers." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
