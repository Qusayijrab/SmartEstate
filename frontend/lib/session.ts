import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { prisma } from "@/lib/db";

export type SessionUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
};

export type SessionData = {
  user?: SessionUser;
};

const password = process.env.IRON_SESSION_PASSWORD;
if (!password || password.length < 32) {
  throw new Error(
    "IRON_SESSION_PASSWORD env var must be set to a 32+ character random string."
  );
}

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "smartestate_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getSession() {
  const store = await cookies();
  return getIronSession<SessionData>(store, sessionOptions);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, "You must be signed in to do that.");
  }
  return user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export async function loadFreshUser(userId: number): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      avatarUrl: true,
    },
  });
  return user;
}
