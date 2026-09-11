import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xiton Personal",
  description: "Gerenciamento de treinos e exercícios de forma simples e intuitiva.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} bg-zinc-950 text-white min-h-screen antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  );
}