import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

async function callGemini(token: string, base64: string, mimeType: string, retries = 2): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${token}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
                  inlineData: { mimeType, data: base64 },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
        }),
      },
    );

    if (res.status === 429) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw new Error("Rate limited by Google API. Try again in a moment.");
    }
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  }
  throw new Error("Gemini call failed after retries");
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = image.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";

    const token = process.env.GOOGLE_AI_TOKEN;
    if (!token) return NextResponse.json({ error: "Google AI not configured" }, { status: 501 });

    const text = await callGemini(token, base64, mimeType);
    return NextResponse.json({ result: text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gemini failed" },
      { status: 500 },
    );
  }
}
