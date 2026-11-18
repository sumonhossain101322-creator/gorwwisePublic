import { jsonError, readBody, rejectCrossOrigin, withSessionCookie } from "@/utils/authCookie";
import { authenticateWithPassword } from "@/utils/password";

export const runtime = "nodejs";

export async function POST(req) {
  const forbidden = rejectCrossOrigin(req);
  if (forbidden) return forbidden;

  const parsed = await readBody(req);
  if (!parsed.ok) return jsonError("Invalid request.", 400);

  try {
    const result = await authenticateWithPassword(parsed.body?.email, parsed.body?.password);
    if (!result.ok) return jsonError(result.message, result.status);
    return withSessionCookie({ user: result.user }, result.user);
  } catch (error) {
    console.error("Login failed", error?.message || error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
