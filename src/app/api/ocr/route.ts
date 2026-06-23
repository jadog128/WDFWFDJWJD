import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createWorker } from "tesseract.js";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("image") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const lang = formData.get("lang")?.toString() || "eng";

    const worker = await createWorker(lang, 1, {
      logger: () => {},
    });

    const { data } = await worker.recognize(buffer);
    await worker.terminate();

    let wordCount = 0;
    const allWords: { text: string; confidence: number }[] = [];
    if (data.blocks) {
      for (const block of data.blocks) {
        if (block.paragraphs) {
          for (const para of block.paragraphs) {
            if (para.lines) {
              for (const line of para.lines) {
                if (line.words) {
                  for (const word of line.words) {
                    allWords.push({ text: word.text, confidence: word.confidence });
                    wordCount++;
                  }
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      text: data.text || "",
      confidence: data.confidence || 0,
      wordCount,
      words: allWords,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OCR processing failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
