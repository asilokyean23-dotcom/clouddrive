import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSchema } from "@/lib/bootstrap";
import { createSession, publicUser, verifyPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return Response.json(
      { error: "Please enter your email and password." },
      { status: 400 },
    );
  }

  await ensureSchema();

  const found = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const user = found[0];

  // Same message for both cases so we never reveal which emails exist.
  const genericError = Response.json(
    { error: "Wrong email or password. Please try again." },
    { status: 401 },
  );
  if (!user) return genericError;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return genericError;

  await createSession(user.id);
  return Response.json({ user: publicUser(user) });
}