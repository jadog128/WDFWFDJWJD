import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.task.findUnique({
    where: { id },
    include: { subject: { select: { userId: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.subject.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subjectId, title, deadline, completed } = await req.json();

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject || subject.userId !== userId) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(subjectId !== undefined && { subjectId }),
      ...(title !== undefined && { title }),
      ...(deadline !== undefined && { deadline: new Date(deadline) }),
      ...(completed !== undefined && { completed }),
    },
    include: { subject: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.task.findUnique({
    where: { id },
    include: { subject: { select: { userId: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.subject.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
