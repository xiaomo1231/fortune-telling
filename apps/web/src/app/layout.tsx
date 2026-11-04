import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "墨星 · 塔罗与东方命理", template: "%s · 墨星" },
  description: "专业排盘加生活化解读：塔罗、八字、每日运势、六爻、观音灵签。传统文化与心理娱乐，仅供参考。",
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f1ea" }, { media: "(prefers-color-scheme: dark)", color: "#17130f" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
