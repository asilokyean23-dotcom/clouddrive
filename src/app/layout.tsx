import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyLocker — your school locker in the cloud",
  description:
    "SkyLocker keeps your essays, homework and photos in one private cloud locker, so you can start at school and finish at home.",
};

/**
 * Applies the saved theme before first paint so the page never flashes the
 * wrong colour scheme. Defaults to dark.
 */
const themeScript = `(function(){try{var t=localStorage.getItem('skylocker-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="text-slate-900 antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}