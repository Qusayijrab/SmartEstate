import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartEstate",
  description: "SmartEstate AI property platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
        style={{ ["--font-georgia" as string]: "Georgia, 'Times New Roman', serif" }}
      >
        {children}
      </body>
    </html>
  );
}
