import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    // Strip data URL prefix to get raw base64
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = image.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";

    const token = process.env.GOOGLE_AI_TOKEN;
    if (!token) return NextResponse.json({ error: "Google AI not configured" }, { status: 501 });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Extract all lessons from this timetable image.
Return ONLY a JSON array of objects with these exact fields:
- dayOfWeek (number, 0=Sun 1=Mon..6=Sat)
- startTime (string, HH:mm format)
- endTime (string, HH:mm format)
- subject (string)
- location (string, empty if none)
- teacher (string, empty if none)

Extract every single lesson visible. Return ONLY the JSON array, no other text.`,
                },
                {
                  inlineData: {
                    mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000,
          },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Gemini error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    return NextResponse.json({ result: text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gemini failed" },
      { status: 500 },
    );
  }
}
