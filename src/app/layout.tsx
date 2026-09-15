import type { Metadata } from "next";
import { Playfair_Display, Roboto, Montserrat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400"], variable: "--font-playfair" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-montserrat" });

export const metadata: Metadata = { title: "Front Office", description: "Hotel front office" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${playfair.variable} ${roboto.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
