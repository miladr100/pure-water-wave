// Stand-in for `next/headers` outside a request: the session helpers call
// `cookies()` and `headers()`, which only exist inside a Next request scope.
// Test files mock the module with this one and set the cookie jar per test:
//
//   vi.mock("next/headers", () => import("../helpers/next-headers"));
//   setSessionCookie(token);
import { SESSION_COOKIE } from "@/lib/academy/session-cookie";

const jar = new Map<string, string>();
const requestHeaders = new Map<string, string>();

export function setSessionCookie(token: string | null) {
  if (token === null) {
    jar.delete(SESSION_COOKIE);
  } else {
    jar.set(SESSION_COOKIE, token);
  }
}

export function setRequestHeader(name: string, value: string | null) {
  if (value === null) {
    requestHeaders.delete(name.toLowerCase());
  } else {
    requestHeaders.set(name.toLowerCase(), value);
  }
}

export function resetNextHeaders() {
  jar.clear();
  requestHeaders.clear();
}

export async function cookies() {
  return {
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    has: (name: string) => jar.has(name),
    set: (name: string, value: string) => {
      jar.set(name, value);
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  };
}

export async function headers() {
  return {
    get: (name: string) => requestHeaders.get(name.toLowerCase()) ?? null,
    has: (name: string) => requestHeaders.has(name.toLowerCase()),
  };
}
