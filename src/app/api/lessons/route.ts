import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const dayOfWeek = req.nextUrl.searchParams.get("dayOfWeek");
    const where: Record<string, unknown> = { subject: { userId } };
    if (dayOfWeek !== null) where.dayOfWeek = parseInt(dayOfWeek, 10);

    const lessons = await prisma.lesson.findMany({
      where,
      include: { subject: { select: { id: true, name: true, color: true } } },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json(lessons);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subjectId, dayOfWeek, startTime, endTime, location, teacher } = await req.json();
    if (!subjectId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject || subject.userId !== userId) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const lesson = await prisma.lesson.create({
      data: { subjectId, dayOfWeek, startTime, endTime, location, teacher },
      include: { subject: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(lesson, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
