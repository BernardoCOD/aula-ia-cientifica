import { createHmac, timingSafeEqual } from "node:crypto";
import { parse } from "cookie";

export const TEACHER_COOKIE = "aula_teacher_session";
const maxAge = 60 * 60 * 8;

function secret() {
  return (
    process.env.JWT_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "aula-ia-teacher-secret"
  );
}
function digest(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function validateTeacherCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || "";
  const expectedPassword = process.env.ADMIN_PASSWORD || "";
  return Boolean(
    expectedUser &&
      expectedPassword &&
      safeEqual(username, expectedUser) &&
      safeEqual(password, expectedPassword)
  );
}

export function createTeacherToken() {
  const payload = `${Date.now() + maxAge * 1000}`;
  return `${payload}.${digest(payload)}`;
}
export function isTeacherTokenValid(token: string | undefined) {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return safeEqual(signature, digest(expires));
}
export function isTeacherRequest(
  req: { headers: { cookie?: string } },
  user?: { role?: string } | null
) {
  if (user?.role === "admin") return true;
  const cookies = parse(req.headers.cookie || "");
  return isTeacherTokenValid(cookies[TEACHER_COOKIE]);
}
// En desarrollo la app corre en http://, donde una cookie "secure" nunca se guarda.
const isProduction = process.env.NODE_ENV === "production";
export const teacherCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
  maxAge,
};
