import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET is not set");
  return {
    password,
    name: "tep-admin",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD is not set");
    if (typeof data.password !== "string" || !passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }
    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  return { unlocked: !!session.data.unlocked };
});
