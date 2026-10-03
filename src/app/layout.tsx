import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudDrive — your USB in the cloud",
  description:
    "Save, sync and continue your school work from home or school with a personal cloud USB.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="text-slate-900 antialiased">{children}</body>
    </html>
  );
}