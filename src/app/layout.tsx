import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Day Simplified",
  description: "The simplest way to not fall behind.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full font-sans bg-slate-200 flex items-center justify-center">
        <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" defer></script>
        <div
          id="app-container"
          className="w-full max-w-[400px] h-dvh max-h-[850px] bg-slate-50 relative overflow-hidden shadow-2xl flex flex-col"
          style={{
            fontFamily: "'Inter', sans-serif",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
