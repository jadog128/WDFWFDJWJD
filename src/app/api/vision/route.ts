import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    const apiKey = process.env.DEEPSEEK_API_KEY || "sk-caafe2e42360442284b5a3cde55c1999";

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You extract timetable data from images. Return ONLY a JSON array of objects with: dayOfWeek (0=Sun,1=Mon..6=Sat), startTime (HH:mm), endTime (HH:mm), subject (string), location (string or empty), teacher (string or empty). If you see a timetable, extract every lesson. If no timetable found, return []. No explanations.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all lessons from this timetable image." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `DeepSeek error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ result: data.choices?.[0]?.message?.content || "[]" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Vision failed" }, { status: 500 });
  }
}
