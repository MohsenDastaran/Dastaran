import { timingSafeEqual } from "node:crypto";
import type { AstroCookies } from "astro";
import { getBlogApiToken } from "./blog-api";

const COOKIE_NAME = "blog_admin";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function tokensEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isBlogAdminToken(token: string | null | undefined) {
  const expected = getBlogApiToken();
  if (!expected || !token) {
    return false;
  }
  return tokensEqual(token, expected);
}

export function isBlogAdmin(cookies: AstroCookies) {
  return isBlogAdminToken(cookies.get(COOKIE_NAME)?.value);
}

export function grantBlogAdmin(cookies: AstroCookies) {
  const token = getBlogApiToken();
  if (!token) {
    return;
  }
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}
