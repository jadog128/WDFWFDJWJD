import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: { _count: { select: { lessons: true, tasks: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(subjects);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, color } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const subject = await prisma.subject.create({
      data: { name, color: color ?? "#18181b", userId },
    });
    return NextResponse.json(subject, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
