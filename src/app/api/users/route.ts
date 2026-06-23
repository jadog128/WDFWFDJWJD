import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { id, email, plan } = await req.json();
    if (!id || !email) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const user = await prisma.user.upsert({
      where: { id },
      create: { id, email, plan: plan ?? "free" },
      update: { email, ...(plan && { plan }) },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
