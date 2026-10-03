"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/**
 * Professional dark / light switch. The chosen theme is written to
 * localStorage and applied to <html data-theme>, which the stylesheet keys
 * off. A tiny inline script in the layout sets it before first paint so the
 * page never flashes the wrong theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("skylocker-theme", next);
    } catch {
      // Storage can be unavailable (private browsing) — theme still applies.
    }
  }

  const label =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${
        className ?? ""
      }`}
    >
      {mounted && theme === "dark" ? (
        /* Sun — switch to light */
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4.1" />
          <path d="M12 2.7v2.1M12 19.2v2.1M2.7 12h2.1M19.2 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5" />
        </svg>
      ) : (
        /* Moon — switch to dark */
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.6 14.7A8.7 8.7 0 1 1 9.3 3.4a7 7 0 0 0 11.3 11.3z" />
        </svg>
      )}
    </button>
  );
}