import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSchema } from "@/lib/bootstrap";
import { createSession, hashPassword, publicUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { name?: string; email?: string; password?: string }
    | null;
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (name.length < 2) {
    return Response.json(
      { error: "Please enter your name (at least 2 letters)." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return Response.json(
      { error: "Your password needs at least 6 characters." },
      { status: 400 },
    );
  }

  await ensureSchema();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) {
    return Response.json(
      { error: "An account with this email already exists. Try signing in." },
      { status: 409 },
    );
  }

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .returning();
  if (!user) {
    return Response.json({ error: "Could not create account" }, { status: 500 });
  }

  await createSession(user.id);
  return Response.json({ user: publicUser(user) });
}