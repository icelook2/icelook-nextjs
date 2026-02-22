import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUser } from "@/lib/auth/session";
import { recordUserConsent } from "@/lib/queries/legal";

/**
 * POST /api/legal/consent
 *
 * Records user consent for a policy version.
 * Requires authentication.
 *
 * Body:
 * - policy_version_id: string (required)
 */
export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { policy_version_id?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { policy_version_id } = body;

  if (!policy_version_id) {
    return NextResponse.json(
      { error: "policy_version_id is required" },
      { status: 400 },
    );
  }

  // Get IP and user agent for audit trail
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    undefined;
  const userAgent = request.headers.get("user-agent") || undefined;

  const success = await recordUserConsent(
    user.id,
    policy_version_id,
    ipAddress,
    userAgent,
  );

  if (!success) {
    return NextResponse.json(
      { error: "Failed to record consent" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
