import { getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: sessionUser });
}
