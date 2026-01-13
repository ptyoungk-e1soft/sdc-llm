import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProvider } from "@/providers/SessionProvider";

const inter = localFont({
  src: "../../public/fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SDC 고객품질 분석 AI 시스템",
  description: "SDC 고객품질 분석 AI 시스템 - LangServe and Ollama 기반",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} font-sans antialiased bg-white`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
