import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const completedParam = req.nextUrl.searchParams.get("completed");
  const where: Record<string, unknown> = {
    subject: { userId },
  };

  if (completedParam === "true") where.completed = true;
  else if (completedParam === "false") where.completed = false;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, color: true } },
    },
    orderBy: { deadline: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subjectId, title, deadline, completed } = await req.json();

  if (!subjectId || !title || !deadline) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject || subject.userId !== userId) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: { subjectId, title, deadline: new Date(deadline), completed: completed ?? false },
    include: {
      subject: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
