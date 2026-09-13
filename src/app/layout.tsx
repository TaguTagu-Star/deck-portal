import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "デッキ構築補佐ポータル",
  description: "カードゲームのデッキ構築補佐ポータルサイト",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
