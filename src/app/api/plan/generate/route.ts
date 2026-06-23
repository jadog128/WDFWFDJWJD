import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();

  const [lessons, tasks] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        dayOfWeek,
        subject: { userId },
      },
      include: { subject: { select: { name: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.task.findMany({
      where: {
        completed: false,
        subject: { userId },
      },
      include: { subject: { select: { name: true } } },
      orderBy: { deadline: "asc" },
    }),
  ]);

  const prompt = `Generate a detailed daily study plan for today.

Today's lessons (day ${dayOfWeek}):
${lessons.map((l: { subject: { name: string }; startTime: string; endTime: string; location?: string | null }) => `- ${l.subject.name}: ${l.startTime}-${l.endTime}${l.location ? ` at ${l.location}` : ""}`).join("\n")}

Pending tasks (sorted by deadline):
${tasks.map((t: { subject: { name: string }; title: string; deadline: Date }) => `- ${t.subject.name}: ${t.title} (due: ${t.deadline.toISOString().split("T")[0]})`).join("\n")}

Provide a structured plan with time blocks, study sessions, and breaks. Format as JSON with keys: "timeBlocks" (array of {startTime, endTime, activity, type: "lesson"|"study"|"break"}) and "notes" (string).`;

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a study planner assistant. Output only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: `DeepSeek API error: ${errText}` }, { status: 502 });
  }

  const data = await res.json();
  const content = JSON.parse(data.choices[0].message.content ?? "{}");

  const plan = await prisma.dailyPlan.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, content },
    update: { content },
  });

  return NextResponse.json(plan);
}
