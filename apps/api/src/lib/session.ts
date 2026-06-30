import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'msk_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret === 'change-me-to-a-long-random-secret') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set to a strong random value in production');
    }
  }
  return new TextEncoder().encode(secret ?? 'dev-insecure-session-secret');
}

export interface SessionPayload {
  sub: string;
  username: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.username !== 'string') return null;
    return { sub: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  const secure = process.env.COOKIE_SECURE === 'true';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function getClearSessionCookieOptions() {
  return {
    ...getSessionCookieOptions(),
    maxAge: 0,
  };
}
