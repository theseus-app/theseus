import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/stores/StoreProvider";

export const metadata: Metadata = {
  title: "Theseus",
  description: "Text-guided Health-study Estimation & Specification Engine Using Strategus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="px-20 xs:px-5">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
