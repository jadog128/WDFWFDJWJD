import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.lesson.findUnique({
      where: { id },
      include: { subject: { select: { userId: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.subject.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { subjectId, dayOfWeek, startTime, endTime, location, teacher } = await req.json();

    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject || subject.userId !== userId) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      }
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: { subjectId, dayOfWeek, startTime, endTime, location, teacher },
      include: { subject: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(lesson);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.lesson.findUnique({
      where: { id },
      include: { subject: { select: { userId: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.subject.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.lesson.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
