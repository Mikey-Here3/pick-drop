import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "pms_admin_session";

export async function isAuthenticated(): Promise<boolean> {
  // If no password is set in env, default to demo/admin mode
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return true;
  }
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return session === "authenticated";
}

export async function requireAuth() {
  const authed = await isAuthenticated();
  if (!authed) {
    throw new Error("Unauthorized: Admin authentication required");
  }
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
