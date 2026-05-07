import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET /api/users/[id] - resolve a Clerk user ID to display name + avatar
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: requestingUserId } = await auth();
  if (!requestingUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(id);

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.username ||
      user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
      `user_${id.slice(0, 6)}`;

    return NextResponse.json({
      id: user.id,
      name,
      imageUrl: user.imageUrl ?? null,
    });
  } catch {
    // User not found or Clerk error - return a safe fallback
    return NextResponse.json({
      id,
      name: `user_${id.slice(0, 6)}`,
      imageUrl: null,
    });
  }
}
