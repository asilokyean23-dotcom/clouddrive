"use client";

import { useState } from "react";
import { SkyLockerMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        mode === "signin" ? "/api/auth/login" : "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "signin" ? { email, password } : { name, email, password },
          ),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      // Success — go to the drive.
      window.location.href = "/";
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-indigo-700 p-12 text-white lg:flex lg:flex-col">

        <div className="flex items-center gap-3">
          <SkyLockerMark className="h-12 w-12 ring-1 ring-white/30" />
          <div>
            <div className="text-lg font-semibold tracking-tight">
              SkyLocker
            </div>
            <div className="text-sm text-white/80">
              Your school locker in the cloud
            </div>
          </div>
        </div>

        <div className="mt-auto max-w-md">
          <h1 className="text-[clamp(2.2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-tight">
            Start at school.
            <br />
            Finish at home.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/85">
            Save your essays, photos, slide decks and homework in one private
            drive — then open the same files on any device, anywhere.
          </p>

          <ul className="mt-8 space-y-3 text-white/90">
            {[
              "🔒 Private — only your account can open your files",
              "📱 Works on your phone, laptop and the school PC",
              "🕒 “Recent” tab shows exactly where you left off",
              "📂 Organise work into folders, star what matters",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="text-base leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 text-sm text-white/70">
          Made for students who work in more than one place.
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center px-6 py-12">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <div className="mx-auto">
              <SkyLockerMark className="mx-auto h-14 w-14 shadow-lg" />
            </div>
            <h1 className="mt-4 text-center text-2xl font-semibold tracking-tight text-slate-900">
              SkyLocker
            </h1>
            <p className="mt-1 text-center text-sm text-slate-500">
              Your school locker in the cloud
            </p>
          </div>

          {/* Tabs */}
          <div className="mt-8 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`rounded-full py-2 font-medium transition ${
                mode === "signin"
                  ? "bg-indigo-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`rounded-full py-2 font-medium transition ${
                mode === "signup"
                  ? "bg-indigo-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Create account
            </button>
          </div>

          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-slate-900">
            {mode === "signin" ? "Welcome back 👋" : "Create your drive"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "signin"
              ? "Sign in to see your files from school and home."
              : "It takes 20 seconds — then your files are always with you."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700"
                >
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kyean"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signin" ? "Your password" : "At least 6 characters"}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-slate-500">
                  Use at least 6 characters. Don&apos;t reuse your school
                  password.
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in to SkyLocker"
                  : "Create my SkyLocker"}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100">
            <span className="font-semibold text-slate-800">Your privacy:</span>{" "}
            your password is stored only as an encrypted hash (never in plain
            text), and each account can only ever see its own files.
          </div>
        </div>
      </main>
    </div>
  );
}